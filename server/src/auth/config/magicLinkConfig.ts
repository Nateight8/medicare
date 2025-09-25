export const magicLinkConfig = {
  magicLinkBaseUrl: "http://localhost:4000",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  tokenExpiry: process.env.MAGIC_LINK_EXPIRES_IN || "15m",
  redisPrefix: process.env.REDIS_PREFIX || "auth:",
} as const;
