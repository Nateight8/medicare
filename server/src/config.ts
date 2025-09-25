import dotenv from "dotenv";

dotenv.config();

export const config = {
  // This should be the frontend URL where the magic link will be clicked
  magicLinkBaseUrl: process.env.MAGIC_LINK_BASE_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  tokenExpiry: process.env.TOKEN_EXPIRY || "1d",
  redisPrefix: process.env.REDIS_PREFIX || "auth:",

  // Keep the old structure for backward compatibility if needed
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  magicLink: {
    secret: process.env.MAGIC_LINK_SECRET || "your-magic-link-secret",
    expiresIn: process.env.MAGIC_LINK_EXPIRES_IN || "15m",
  },
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 4000,
} as const;
