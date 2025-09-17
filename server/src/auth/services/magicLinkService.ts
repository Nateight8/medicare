import { redisUtil } from "../../lib/redis";
import { JWTTokenService } from "./tokenService";
import { emailService } from "./emailService";
import type { MagicLinkService, TokenPayload, AuthConfig } from "../types";
import { randomUUID } from "crypto";

export class MagicLinkServiceImpl implements MagicLinkService {
  private readonly config: Required<AuthConfig>;
  private readonly tokenService: JWTTokenService;
  private readonly tokenExpiry: string;

  constructor(config: AuthConfig) {
    // Ensure tokenExpiry is always a string
    this.tokenExpiry = typeof config.tokenExpiry === 'number' 
      ? `${config.tokenExpiry}ms` 
      : config.tokenExpiry || '1h';
    
    this.config = {
      magicLinkBaseUrl: config.magicLinkBaseUrl || '',
      jwtSecret: config.jwtSecret || 'your-secret-key',
      tokenExpiry: this.tokenExpiry,
      redisPrefix: config.redisPrefix || 'auth:',
    };

    this.tokenService = new JWTTokenService(this.config);
    
    console.log("[MagicLinkService] Initialized with config:", {
      ...this.config,
      jwtSecret: "***", // Hide actual secret in logs
    });
  }

  private getRedisKey(token: string): string {
    return `${this.config.redisPrefix}magiclink:${token}`;
  }

  async requestMagicLink(email: string): Promise<{ expiresIn: string }> {
    console.log(`[MagicLinkService] Requesting magic link for: ${email}`);

    try {
      const payload: TokenPayload = {
        email,
        type: "magiclink",
      };

      console.log("[MagicLinkService] Generating token...");
      const token = await this.tokenService.generateToken(payload, {
        expiresIn: this.config.tokenExpiry,
      });

      const link = `${this.config.magicLinkBaseUrl}?token=${token}`;
      console.log(`[MagicLinkService] Generated magic link: ${link}`);

      // Store in Redis
      const redisKey = this.getRedisKey(token);
      console.log(
        `[MagicLinkService] Storing token in Redis with key: ${redisKey}`
      );

      const ttl = 15 * 60; // 15 minutes
      const stored = await redisUtil.set(redisKey, email, ttl);
      if (!stored) throw new Error("Failed to store token in Redis");

      console.log(`[MagicLinkService] Token stored in Redis with TTL: ${ttl}s`);

      // Send email
      console.log(`[MagicLinkService] Sending magic link email to: ${email}`);
      await emailService.sendMagicLink(email, link);
      console.log("[MagicLinkService] Magic link email sent successfully");
      
      // Return the token's expiration time as a string
      return { expiresIn: this.tokenExpiry };
    } catch (error) {
      console.error("[MagicLinkService] Error in requestMagicLink:", error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<TokenPayload | null> {
    console.log("[MagicLinkService] Validating token");

    try {
      console.log("[MagicLinkService] Verifying token signature...");
      const payload = await this.tokenService.verifyToken(token);

      if (!payload || payload.type !== "magiclink") {
        console.log("[MagicLinkService] Invalid token payload or type");
        return null;
      }

      const redisKey = this.getRedisKey(token);
      console.log(`[MagicLinkService] Checking Redis for key: ${redisKey}`);

      const value = await redisUtil.get(redisKey);
      if (!value) {
        console.log(
          "[MagicLinkService] Token not found in Redis or already used"
        );
        return null;
      }

      console.log("[MagicLinkService] Token found in Redis, deleting...");
      await redisUtil.del(redisKey);

      console.log(
        "[MagicLinkService] Token validated successfully for email:",
        payload.email
      );
      return payload;
    } catch (error) {
      console.error("[MagicLinkService] Error validating token:", error);
      return null;
    }
  }

  // --------------------------
  // New QR Authentication Methods
  // --------------------------

  async storeAuthRequest(
    emailOrUserId: string,
    ttlSeconds = 120
  ): Promise<string> {
    const requestId = randomUUID();
    const key = `${this.config.redisPrefix}qr:${requestId}`;

    const stored = await redisUtil.set(key, emailOrUserId, ttlSeconds);
    if (!stored) {
      throw new Error(`Failed to store auth request ${requestId}`);
    }

    console.log(
      `[MagicLinkService] Stored QR auth request: ${requestId} for identifier: ${emailOrUserId}`
    );

    return requestId;
  }

  async getAuthRequestStatus(
    requestId: string
  ): Promise<{ status: "pending" | "authenticated"; token?: string } | null> {
    const statusKey = `${this.config.redisPrefix}qrstatus:${requestId}`;
    const statusJson = await redisUtil.get(statusKey);
    return statusJson ? JSON.parse(statusJson) : null;
  }

  async consumeAuthRequest(requestId: string): Promise<string | null> {
    const key = `${this.config.redisPrefix}qr:${requestId}`;
    const userId = await redisUtil.get(key);
    if (!userId) return null;

    await redisUtil.del(key);
    console.log(
      `[MagicLinkService] Consumed QR auth request: ${requestId} for user: ${userId}`
    );
    return userId;
  }

  async markAuthRequestComplete(
    requestId: string,
    token: string,
    ttlSeconds = 60
  ): Promise<void> {
    const statusKey = `${this.config.redisPrefix}qrstatus:${requestId}`;
    await redisUtil.set(
      statusKey,
      JSON.stringify({ status: "authenticated", token }),
      ttlSeconds
    );
    console.log(
      `[MagicLinkService] Marked QR auth request complete: ${requestId}`
    );
  }
}
