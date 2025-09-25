// src/auth/services/tokenService.ts

import jwt from "jsonwebtoken";
import { TokenPayload, TokenOptions, TokenService, AuthConfig } from "../types";

// Helper function to promisify jwt methods
const jwtSign = (
  payload: string | object | Buffer,
  secret: string,
  options?: jwt.SignOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options || {}, (err, token) => {
      if (err) return reject(err);
      if (!token) return reject(new Error("Token generation failed"));
      resolve(token);
    });
  });
};

const jwtVerify = (token: string, secret: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

export class JWTTokenService implements TokenService {
  private readonly secret: string;
  private readonly defaultExpiry: string;

  constructor(config: AuthConfig) {
    this.secret = config.jwtSecret;
    this.defaultExpiry =
      typeof config.tokenExpiry === "string" ? config.tokenExpiry : "1h";
  }

  async generateToken(
    payload: TokenPayload,
    options?: TokenOptions
  ): Promise<string> {
    const expiresIn = options?.expiresIn || this.defaultExpiry;

    try {
      const signOptions: jwt.SignOptions = {};

      if (expiresIn) {
        // Convert expiresIn to seconds if it's a string like '15m' or '1h'
        let expiresInSeconds: number;
        if (typeof expiresIn === "string") {
          const match = expiresIn.match(/^(\d+)([smh])$/);
          if (match) {
            const value = parseInt(match[1]!);
            const unit = match[2];
            switch (unit) {
              case "s":
                expiresInSeconds = value;
                break;
              case "m":
                expiresInSeconds = value * 60;
                break;
              case "h":
                expiresInSeconds = value * 60 * 60;
                break;
              default:
                expiresInSeconds = 15 * 60; // Default to 15 minutes
            }
          } else {
            expiresInSeconds = 15 * 60; // Default to 15 minutes if format is invalid
          }
        } else {
          expiresInSeconds = expiresIn;
        }

        // Set the exp claim in the payload
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        (payload as any).exp = now + expiresInSeconds;
        (payload as any).iat = now;
      }

      return await jwtSign(payload as object, this.secret, signOptions);
    } catch (error) {
      console.error("Error generating token:", error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = await jwtVerify(token, this.secret);
      return decoded as TokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        console.log("[JWTTokenService] Token has expired");
        throw new Error("expired");
      } else if (err instanceof jwt.JsonWebTokenError) {
        console.error("[JWTTokenService] Invalid token:", err.message);
        throw new Error("invalid");
      }
      console.error("[JWTTokenService] Error verifying token:", err);
      throw new Error("invalid");
    }
  }
}
