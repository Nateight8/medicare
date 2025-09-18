import { redisUtil } from "../../lib/redis";
import { JWTTokenService } from "./tokenService";
import { emailService } from "./emailService";
import type { MagicLinkService, TokenPayload, AuthConfig, TokenValidationResult } from "../types";
import { randomUUID } from "crypto";

export class MagicLinkServiceImpl implements MagicLinkService {
  private readonly config: Required<AuthConfig>;
  private readonly tokenService: JWTTokenService;
  private readonly tokenExpiry: string;

  constructor(config: AuthConfig) {
    // Ensure tokenExpiry is always a string
    this.tokenExpiry =
      typeof config.tokenExpiry === "number"
        ? `${config.tokenExpiry}ms`
        : config.tokenExpiry || "1h";

    this.config = {
      magicLinkBaseUrl: config.magicLinkBaseUrl || "",
      jwtSecret: config.jwtSecret || "your-secret-key",
      tokenExpiry: this.tokenExpiry,
      redisPrefix: config.redisPrefix || "auth:",
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

  private getEmailTokensKey(email: string): string {
    return `${this.config.redisPrefix}email:${email}`;
  }

  private async addTokenToEmailMapping(
    email: string,
    token: string,
    ttl: number
  ): Promise<void> {
    const emailTokensKey = this.getEmailTokensKey(email);
    const existingTokensJson = await redisUtil.get(emailTokensKey);
    const existingTokens: string[] = existingTokensJson
      ? JSON.parse(existingTokensJson)
      : [];

    // Add the new token
    existingTokens.push(token);

    // Store updated tokens list
    await redisUtil.set(emailTokensKey, JSON.stringify(existingTokens), ttl);
    console.log(
      `[MagicLinkService] Added token to email mapping for ${email}: ${token}`
    );
  }

  private async removeTokenFromEmailMapping(
    email: string,
    token: string
  ): Promise<void> {
    const emailTokensKey = this.getEmailTokensKey(email);
    const tokensJson = await redisUtil.get(emailTokensKey);

    if (!tokensJson) return;

    const tokens: string[] = JSON.parse(tokensJson);
    const updatedTokens = tokens.filter((t) => t !== token);

    if (updatedTokens.length === 0) {
      // No tokens left, delete the mapping
      await redisUtil.del(emailTokensKey);
      console.log(
        `[MagicLinkService] Removed empty email mapping for ${email}`
      );
    } else {
      // Update the mapping with remaining tokens
      const remainingTtl = await redisUtil.ttl(emailTokensKey);
      await redisUtil.set(
        emailTokensKey,
        JSON.stringify(updatedTokens),
        remainingTtl > 0 ? remainingTtl : 15 * 60
      );
      console.log(
        `[MagicLinkService] Removed token from email mapping for ${email}: ${token}`
      );
    }
  }

  async requestMagicLink(email: string): Promise<{ expiresIn: string }> {
    try {
      console.log(`[MagicLinkService] Requesting magic link for email: ${email}`);

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

      // Store in Redis with metadata
      const redisKey = this.getRedisKey(token);
      console.log(`[MagicLinkService] Storing token in Redis with key: ${redisKey}`);

      const ttl = 15 * 60; // 15 minutes
      const now = Date.now();
      const tokenData = {
        email,
        status: 'active',
        issuedAt: now,
        expiresAt: now + (ttl * 1000),
        lastUsedAt: null
      };

      // Store the token with metadata
      const stored = await redisUtil.set(redisKey, JSON.stringify(tokenData), ttl);
      if (!stored) throw new Error("Failed to store token in Redis");

      // Add token to email mapping for efficient revocation
      await this.addTokenToEmailMapping(email, token, ttl);

      console.log(`[MagicLinkService] Token stored in Redis with TTL: ${ttl}s`);

      // Send email
      console.log(`[MagicLinkService] Sending magic link email to: ${email}`);
      await emailService.sendMagicLink(email, link);
      console.log("[MagicLinkService] Magic link email sent successfully");

      return { expiresIn: this.tokenExpiry };
    } catch (error) {
      console.error("[MagicLinkService] Error in requestMagicLink:", error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    console.log("[MagicLinkService] Validating token");

    // First check if token exists in Redis
    const redisKey = this.getRedisKey(token);
    const tokenDataStr = await redisUtil.get(redisKey);
    
    if (!tokenDataStr) {
      console.log("[MagicLinkService] Token not found in Redis - already used or revoked");
      return { payload: null, error: 'used_or_revoked' };
    }

    try {
      // Verify token signature and expiration
      console.log("[MagicLinkService] Verifying token signature...");
      let payload: TokenPayload | null;
      
      try {
        payload = await this.tokenService.verifyToken(token);
        
        if (!payload || payload.type !== "magiclink") {
          console.log("[MagicLinkService] Invalid token payload or type");
          return { payload: null, error: 'invalid' };
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'expired') {
            return { payload: null, error: 'expired' };
          } else if (error.message === 'invalid') {
            return { payload: null, error: 'invalid' };
          }
        }
        console.error("[MagicLinkService] Error verifying token:", error);
        return { payload: null, error: 'invalid' };
      }

      const tokenData = JSON.parse(tokenDataStr);
      const now = Date.now();
      
      // Check if token is expired
      if (now > tokenData.expiresAt) {
        console.log("[MagicLinkService] Token has expired");
        await redisUtil.del(redisKey); // Clean up expired token
        return { payload: null, error: 'expired' };
      }

      // Mark token as used and update last used timestamp
      tokenData.status = 'used';
      tokenData.lastUsedAt = now;
      await redisUtil.set(redisKey, JSON.stringify(tokenData), 60); // Keep used token for 1 minute before cleanup

      // Remove token from email mapping
      await this.removeTokenFromEmailMapping(payload.email, token);

      console.log(
        "[MagicLinkService] Token validated successfully for email:",
        payload.email
      );
      return { payload };
    } catch (error) {
      console.error("[MagicLinkService] Error validating token:", error);
      return { payload: null, error: 'invalid' };
    }
  }

  async revokeMagicLink(email: string): Promise<boolean> {
    console.log(`[MagicLinkService] Revoking magic link for email: ${email}`);

    try {
      const emailTokensKey = this.getEmailTokensKey(email);
      const tokensJson = await redisUtil.get(emailTokensKey);

      if (!tokensJson) {
        console.log(
          `[MagicLinkService] No active tokens found for email: ${email}`
        );
        return false;
      }

      const tokens: string[] = JSON.parse(tokensJson);

      // Delete all token keys in parallel
      const deletePromises = tokens.map((token) =>
        redisUtil.del(this.getRedisKey(token))
      );

      // Also delete the email->tokens mapping
      deletePromises.push(redisUtil.del(emailTokensKey));

      await Promise.all(deletePromises);

      console.log(
        `[MagicLinkService] Revoked ${tokens.length} magic link(s) for email: ${email}`
      );
      return true;
    } catch (error) {
      console.error("[MagicLinkService] Error revoking magic link:", error);
      throw error;
    }
  }

  // --------------------------
  // QR Authentication Methods
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
