import { redisUtil } from "../../lib/redis";
import { JWTTokenService } from "./tokenService";
import { emailService } from "./emailService";
import type { MagicLinkService, TokenPayload, AuthConfig } from "../types";

export class MagicLinkServiceImpl implements MagicLinkService {
  private config: Required<AuthConfig>;
  private tokenService: JWTTokenService;

  constructor(config: AuthConfig) {
    // Set default values
    this.config = {
      magicLinkBaseUrl: config.magicLinkBaseUrl,
      jwtSecret: config.jwtSecret,
      tokenExpiry: config.tokenExpiry || '15m',
      redisPrefix: config.redisPrefix || 'auth:'
    };
    
    // Ensure redisPrefix ends with a colon
    if (!this.config.redisPrefix.endsWith(':')) {
      this.config.redisPrefix = `${this.config.redisPrefix}:`;
    }
    
    this.tokenService = new JWTTokenService(this.config);
    
    console.log('[MagicLinkService] Initialized with config:', {
      ...this.config,
      jwtSecret: '***' // Don't log the actual secret
    });
  }

  private getRedisKey(token: string): string {
    return `${this.config.redisPrefix}magiclink:${token}`;
  }

  async requestMagicLink(email: string): Promise<void> {
    console.log(`[MagicLinkService] Requesting magic link for: ${email}`);
    
    try {
      const payload: TokenPayload = {
        userId: "", // will be resolved when the user clicks the link
        email,
        type: "magiclink",
      };

      console.log('[MagicLinkService] Generating token...');
      const token = await this.tokenService.generateToken(payload, {
        expiresIn: this.config.tokenExpiry,
      });

      const link = `${this.config.magicLinkBaseUrl}?token=${token}`;
      console.log(`[MagicLinkService] Generated magic link: ${link}`);

      // Store in Redis
      const redisKey = this.getRedisKey(token);
      console.log(`[MagicLinkService] Storing token in Redis with key: ${redisKey}`);
      
      const ttl = 15 * 60; // 15 minutes in seconds
      const stored = await redisUtil.set(redisKey, email, ttl);
      
      if (!stored) {
        throw new Error('Failed to store token in Redis');
      }
      
      console.log(`[MagicLinkService] Token stored in Redis with TTL: ${ttl}s`);
      
      // Send email
      console.log(`[MagicLinkService] Sending magic link email to: ${email}`);
      await emailService.sendMagicLink(email, link);
      console.log('[MagicLinkService] Magic link email sent successfully');
      
    } catch (error) {
      console.error('[MagicLinkService] Error in requestMagicLink:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  async validateToken(token: string): Promise<TokenPayload | null> {
    console.log(`[MagicLinkService] Validating token`);
    
    try {
      // First verify the token signature and expiration
      console.log('[MagicLinkService] Verifying token signature...');
      const payload = await this.tokenService.verifyToken(token);
      
      if (!payload || payload.type !== "magiclink") {
        console.log('[MagicLinkService] Invalid token payload or type');
        return null;
      }
      
      // Check Redis for one-time use
      const redisKey = this.getRedisKey(token);
      console.log(`[MagicLinkService] Checking Redis for key: ${redisKey}`);
      
      const value = await redisUtil.get(redisKey);
      if (!value) {
        console.log('[MagicLinkService] Token not found in Redis or already used');
        return null;
      }
      
      // Invalidate the token after first use (one-time use)
      console.log('[MagicLinkService] Token found in Redis, deleting...');
      await redisUtil.del(redisKey);
      
      console.log('[MagicLinkService] Token validated successfully for email:', payload.email);
      return payload;
      
    } catch (error) {
      console.error('[MagicLinkService] Error validating token:', error);
      return null;
    }
  }
}
