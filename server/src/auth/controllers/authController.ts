// src/auth/controllers/authController.ts
import { Request, Response } from "express";
import { MagicLinkServiceImpl } from "../services/magicLinkService";

// Create an instance of MagicLinkServiceImpl with required configuration
const magicLinkService = new MagicLinkServiceImpl({
  magicLinkBaseUrl:
    process.env.FRONTEND_URL || "http://localhost:3000/auth/verify",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  tokenExpiry: "1h",
  redisPrefix: "auth:",
});

export const authController = {
  async sendMagicLink(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    await magicLinkService.requestMagicLink(email);
    return res.status(200).json({ message: "Magic link sent!" });
  },

  async validateMagicLink(req: Request, res: Response) {
    const { token } = req.query;
    if (typeof token !== "string")
      return res.status(400).json({ error: "Invalid token" });

    const payload = await magicLinkService.validateToken(token);
    if (!payload)
      return res.status(401).json({ error: "Invalid or expired token" });

    // Optionally: create a session or return a JWT here
    return res.status(200).json({ message: "Authenticated", payload });
  },
};
