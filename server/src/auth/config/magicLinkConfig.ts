export const magicLinkConfig = {
  magicLinkBaseUrl: process.env.API_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  tokenExpiry: process.env.MAGIC_LINK_EXPIRES_IN!,
  redisPrefix: process.env.REDIS_PREFIX!,
} as const;
