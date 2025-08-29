// src/auth/controllers/authController.ts
import { Request, Response } from "express";
import { MagicLinkServiceImpl } from "../services/magicLinkService";
import { parse } from "useragent";
import { redisUtil } from "@/lib/redis";
import { TokenPayload } from "../types";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { addDays, isBefore } from "date-fns";

const magicLinkService = new MagicLinkServiceImpl({
  magicLinkBaseUrl:
    process.env.BACKEND_URL ||
    "http://localhost:4000/api/auth/magiclink/validate",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  tokenExpiry: "1h",
  redisPrefix: "auth:",
});

export const authController = {
  async sendMagicLink(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    await magicLinkService.requestMagicLink(email);
    return res.status(200).json({ message: "Magic link sent!", success: true });
  },

  async validateMagicLink(req: Request, res: Response) {
    const { token } = req.query;
    if (typeof token !== "string") {
      return res.status(400).json({ error: "Invalid token" });
    }

    const payload = await magicLinkService.validateToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // ✅ Ensure user exists in DB
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
        },
      });
    }

    // Detect device type
    const ua = req.headers["user-agent"] || "";
    const agent = parse(ua);
    const isMobile = agent.device?.toString().toLowerCase().includes("mobile");

    if (isMobile) {
      // Mobile deep link
      return res.redirect(
        `yourapp://auth/verify?token=${encodeURIComponent(token)}`
      );
    }

    // Desktop QR fallback — store userId instead of email
    const requestId = await magicLinkService.storeAuthRequest(user.id);
    return res.redirect(
      `${process.env.WEB_APP_URL}/auth/qr?requestId=${encodeURIComponent(
        requestId
      )}`
    );
  },

  async continueOnDevice(req: Request, res: Response) {
    const { requestId } = req.body;
    if (!requestId || typeof requestId !== "string") {
      return res.status(400).json({ error: "Missing or invalid requestId" });
    }

    try {
      // Retrieve stored session from Redis
      const sessionKey = `auth:qr:${requestId}`;
      const userId = await redisUtil.get(sessionKey);

      if (!userId) {
        return res.status(400).json({ error: "Invalid or expired session" });
      }

      // Get user from DB
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Access token payload
      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        type: "magiclink",
      };

      // 1️⃣ Issue short-lived access token
      const accessToken = await (magicLinkService as any)[
        "tokenService"
      ].generateToken(payload, { expiresIn: process.env.JWT_EXPIRY || "1h" });

      // 2️⃣ Generate and store long-lived refresh token
      const refreshTokenValue = crypto.randomBytes(32).toString("hex");
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshTokenValue)
        .digest("hex");

      await prisma.refreshToken.create({
        data: {
          tokenHash: refreshTokenHash,
          userId: user.id,
          expiresAt: addDays(new Date(), 30), // 30 days validity
        },
      });

      // 3️⃣ Store both tokens in HTTP-only cookies
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

      // 4️⃣ Clean up Redis
      await redisUtil.del(sessionKey);

      // ✅ Send user data in response
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          timeZone: user.timeZone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          onboarded: user.onboarded,
        },
      });
    } catch (err) {
      console.error("ContinueOnDevice error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshTokenValue = req.cookies?.refresh_token;
      if (!refreshTokenValue) {
        return res.status(401).json({ error: "No refresh token provided" });
      }

      // Hash incoming token for DB lookup
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshTokenValue)
        .digest("hex");

      // Find token in DB
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: refreshTokenHash },
        include: { user: true },
      });

      if (!storedToken || isBefore(storedToken.expiresAt, new Date())) {
        return res
          .status(401)
          .json({ error: "Invalid or expired refresh token" });
      }

      const user = storedToken.user;

      // Create new access token
      const payload = {
        userId: user.id,
        email: user.email,
        type: "refresh",
      };

      const newAccessToken = await (magicLinkService as any)[
        "tokenService"
      ].generateToken(payload, { expiresIn: process.env.JWT_EXPIRY || "1h" });

      // 🔄 Optional: Rotate refresh token to prevent reuse
      const newRefreshTokenValue = crypto.randomBytes(32).toString("hex");
      const newRefreshTokenHash = crypto
        .createHash("sha256")
        .update(newRefreshTokenValue)
        .digest("hex");

      await prisma.$transaction([
        prisma.refreshToken.delete({ where: { id: storedToken.id } }),
        prisma.refreshToken.create({
          data: {
            tokenHash: newRefreshTokenHash,
            userId: user.id,
            expiresAt: addDays(new Date(), 30),
          },
        }),
      ]);

      // Set new cookies
      res.cookie("auth_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600 * 1000, // 1h
      });

      res.cookie("refresh_token", newRefreshTokenValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Refresh token error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
