// src/auth/controllers/authController.ts
import { Request, Response } from "express";
import { MagicLinkServiceImpl } from "../services/magicLinkService";
import { parse } from "useragent";
import { redisUtil } from "@/lib/redis";
import { TokenPayload } from "../types";
import prisma from "@/lib/prisma";

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

      // Issue JWT
      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        type: "magiclink",
      };

      const token = await (magicLinkService as any)[
        "tokenService"
      ].generateToken(payload, { expiresIn: process.env.JWT_EXPIRY || "1h" });

      // Store token in HTTP-only cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600 * 1000, // 1h
      });

      // Clean up Redis
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
        },
      });
    } catch (err) {
      console.error("ContinueOnDevice error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
