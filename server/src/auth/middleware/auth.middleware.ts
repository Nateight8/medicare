import type { Request, Response, NextFunction } from "express";
import { JWTTokenService } from "../services/tokenService.js";
import type { TokenPayload, AuthConfig } from "../types/index.js";

export function createAuthMiddleware(config: AuthConfig) {
  const tokenService = new JWTTokenService(config);

  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: "Authorization header missing or malformed" });
      }

      const token = authHeader.split(" ")[1];
      const payload = await tokenService.verifyToken(token as string);

      if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Attach user info to request object
      (req as unknown as { user?: TokenPayload }).user = payload;

      next();
    } catch (err) {
      console.error("Auth Middleware error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
