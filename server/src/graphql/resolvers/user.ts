import { GraphQLError } from "graphql";
import { isValidIANA } from "@/graphql/utils/time-zone"; // <-- helper for time zone validation
import { GraphqlContext } from "../context";
import { UpdateProfileInput } from "../typedefs/user";
import { redisUtil } from "@/lib/redis";
import { createHash } from "crypto";

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, ctx: GraphqlContext) => {
      const { user } = ctx;

      if (!user?.id) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const updatedUser = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          timeZone: true,
          onboarded: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!updatedUser) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return updatedUser;
    },
  },

  Mutation: {
    updateProfile: async (
      _: unknown,
      { input }: { input: UpdateProfileInput },
      ctx: GraphqlContext
    ) => {
      if (!ctx?.user?.id) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const { displayName, phone, timeZone, dateOfBirth, image } = input;

      if (timeZone && !isValidIANA(timeZone)) {
        throw new GraphQLError("Invalid timeZone", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existingUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, onboarded: true },
      });

      if (!existingUser) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Only include fields that are provided in the input
      const data: Record<string, any> = {};

      // Basic profile information
      if (displayName !== undefined) data.displayName = displayName;
      if (phone !== undefined) data.phone = phone;
      if (timeZone !== undefined) data.timeZone = timeZone;

      // User preferences and display settings
      if (displayName !== undefined) data.displayName = displayName;
      if (image !== undefined) data.image = image;

      // Parse date string to Date object for database storage
      if (dateOfBirth !== undefined) data.dateOfBirth = new Date(dateOfBirth);

      // Mark as onboarded if name is provided and it's not yet true
      if (!existingUser.onboarded && displayName) {
        data.onboarded = true;
      }

      try {
        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data,
        });

        return { success: true };
      } catch (e: any) {
        console.error("Update profile error:", e);
        if (e?.code === "P2002") {
          const field = e?.meta?.target?.[0] ?? "field";
          throw new GraphQLError(`${field} already in use`, {
            extensions: { 
              code: "BAD_USER_INPUT",
              details: e.message,
              meta: e.meta
            },
          });
        }
        throw new GraphQLError(e.message || "Failed to update profile", {
          extensions: { 
            code: "INTERNAL_SERVER_ERROR",
            details: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
          },
        });
      }
    },

    logout: async (_: unknown, __: unknown, ctx: GraphqlContext) => {
      const { user, prisma, res, req } = ctx;
      if (!user?.id) {
        return { success: true }; // Already logged out
      }

      try {
        const refreshTokenValue = req?.cookies?.refresh_token;
        if (refreshTokenValue) {
          // Hash it for DB lookup
          const refreshTokenHash = createHash("sha256")
            .update(refreshTokenValue)
            .digest("hex");

          // Delete refresh token from DB
          await prisma.refreshToken.deleteMany({
            where: { tokenHash: refreshTokenHash, userId: user.id },
          });
        }

        // Clear cookies
        res?.clearCookie("auth_token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        res?.clearCookie("refresh_token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return { success: true };
      } catch (err) {
        console.error("Logout error:", err);
        return { success: false };
      }
    },
  },
};
