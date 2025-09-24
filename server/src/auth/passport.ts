import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import passport from "passport";

const prisma = new PrismaClient();

// Define the user type for Passport
interface User {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
}

// Serialize user into the session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Export a function to configure the Google strategy
export const configureGoogleStrategy = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "Google OAuth credentials not found. Google login will be disabled."
    );
    return;
  }

  // Google OAuth Strategy
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/google/callback`,
        passReqToCallback: true,
        scope: ["profile", "email"],
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          // Find or create user
          const user = await prisma.user.upsert({
            where: { email: profile.emails[0].value },
            update: {
              name: profile.name?.givenName,
            },
            create: {
              email: profile.emails[0].value,
              name: profile.name?.givenName,
            },
          });

          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
          });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};

// Configure the Google strategy when this module is imported
configureGoogleStrategy();

export default passport;
