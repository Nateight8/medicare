import { Router } from "express";
import passport from "passport";
import { RateLimiterMemory } from "rate-limiter-flexible";
// No need for @types/rate-limiter-flexible as types are included
import { redisUtil } from "@/lib/redis";
import { User } from "@prisma/client";
import { MagicLinkServiceImpl } from "../services/magicLinkService";
import { magicLinkConfig } from "../config/magicLinkConfig";

import { addDays } from "date-fns";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { createSession } from "../services/sessionService";

const magicLinkService = new MagicLinkServiceImpl(magicLinkConfig);

const router = Router();

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 15 * 60, // per 15 minutes
});

// --- 1. Start Google OAuth login ---
router.get("/auth/google", async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip ?? "unknown-ip");

    // Store any state or return URL before authentication
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo as string;
    }

    // Initialize authentication with Google
    return passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      failureRedirect: `${process.env.CORS_ORIGIN}/login?error=oauth_failed`,
    })(req, res, next);
  } catch (error) {
    console.error("Rate limit exceeded for Google OAuth:", error);
    return res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  }
});

// --- 2. Google OAuth callback ---
router.get(
  "/auth/google/callback",
  (req, res, next) => {
    // Handle the Google OAuth callback
    passport.authenticate(
      "google",
      {
        session: false,
        failureRedirect: `${process.env.CORS_ORIGIN}/login?error=oauth_failed`,
      },
      (error: any, user: any, info: any) => {
        if (error || !user) {
          console.error("Google OAuth error:", error || info);
          return res.redirect(
            `${process.env.CORS_ORIGIN}/login?error=oauth_failed`
          );
        }

        // Attach user to request for the next middleware
        req.user = user;
        next();
      }
    )(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user as User & { id: string };
      if (!user) {
        throw new Error("No user returned from OAuth");
      }

      // Check for pending Magic Link validation
      if (redisUtil) {
        const validatedState = await redisUtil.get(`auth:status:${user.email}`);
        if (validatedState === "validated") {
          await redisUtil.del(`auth:status:${user.email}`);
        }
      }

      // Generate access token (same as magic link)
      const payload = {
        userId: user.id,
        email: user.email,
        type: "oauth",
      };

      const accessToken = await (magicLinkService as any)[
        "tokenService"
      ].generateToken(payload, { expiresIn: process.env.JWT_EXPIRY || "1h" });

      // Generate refresh token
      const refreshTokenValue = crypto.randomBytes(32).toString("hex");
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshTokenValue)
        .digest("hex");

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          tokenHash: refreshTokenHash,
          userId: user.id,
          expiresAt: addDays(new Date(), 30),
        },
      });

      // ✅ Create a new session record
      await createSession(user.id, req);

      // Set HTTP-only cookies
      res.cookie("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600 * 1000, // 1h
      });

      res.cookie("refresh_token", refreshTokenValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Check if user needs to complete onboarding
      if (!user.onboarded) {
        return res.redirect(`${process.env.CORS_ORIGIN}/onboarding`);
      }

      // Redirect onboarded users to the root path
      return res.redirect(`${process.env.CORS_ORIGIN}/`);
    } catch (error) {
      console.error("[OAuth Callback Error]:", error);
      return res.redirect(
        `${process.env.CORS_ORIGIN}/login?error=oauth_failed`
      );
    }
  }
);

export default router;
