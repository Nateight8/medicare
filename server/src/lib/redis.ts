import { createClient } from "redis";

// Create Redis client with connection options
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`[Redis] Reconnecting, attempt ${retries + 1}`);
      return Math.min(retries * 100, 5000); // Reconnect with backoff, max 5s
    },
  },
});

// Log connection events
redisClient.on("connect", () => {
  console.log("[Redis] Client connected");
});

redisClient.on("ready", () => {
  console.log("[Redis] Client ready to accept commands");
});

redisClient.on("error", (err: Error) => {
  console.error("[Redis] Client Error:", err);
});

redisClient.on("reconnecting", () => {
  console.log("[Redis] Reconnecting...");
});

// Initialize connection
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("[Redis] Connection established successfully");
    }
  } catch (error) {
    console.error("[Redis] Failed to connect:", error);
    process.exit(1); // Exit if we can't connect to Redis
  }
};

// Connect immediately when this module is imported
connectRedis().catch(console.error);

export const redisUtil = {
  set: async (
    key: string,
    value: string,
    ttlInSeconds?: number
  ): Promise<boolean> => {
    try {
      if (ttlInSeconds) {
        await redisClient.setEx(key, ttlInSeconds, value);
        console.log(`[Redis] Set key "${key}" with TTL ${ttlInSeconds}s`);
      } else {
        await redisClient.set(key, value);
        console.log(`[Redis] Set key "${key}"`);
      }
      return true;
    } catch (error) {
      console.error(`[Redis] Error setting key "${key}":`, error);
      return false;
    }
  },

  get: async (key: string): Promise<string | null> => {
    try {
      const value = await redisClient.get(key);
      console.log(
        `[Redis] Get key "${key}":`,
        value ? `"${value}"` : "Not found"
      );
      return value;
    } catch (error) {
      console.error(`[Redis] Error getting key "${key}":`, error);
      return null;
    }
  },

  del: async (key: string): Promise<boolean> => {
    try {
      const result = await redisClient.del(key);
      console.log(
        `[Redis] Deleted key "${key}":`,
        result ? "Success" : "Key did not exist"
      );
      return result > 0;
    } catch (error) {
      console.error(`[Redis] Error deleting key "${key}":`, error);
      return false;
    }
  },

  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await redisClient.exists(key);
      console.log(
        `[Redis] Check exists "${key}":`,
        result ? "Exists" : "Does not exist"
      );
      return result === 1;
    } catch (error) {
      console.error(`[Redis] Error checking if key "${key}" exists:`, error);
      return false;
    }
  },

  // Additional utility methods
  getClient: () => redisClient,

  healthCheck: async (): Promise<boolean> => {
    try {
      await redisClient.ping();
      console.log("[Redis] Health check: OK");
      return true;
    } catch (error) {
      console.error("[Redis] Health check failed:", error);
      return false;
    }
  },
  
  ttl: async (key: string): Promise<number> => {
    try {
      const ttl = await redisClient.ttl(key);
      return ttl;
    } catch (error) {
      console.error(`[Redis] Error getting TTL for key ${key}:`, error);
      return -2; // Returns -2 if the key doesn't exist (standard Redis behavior)
    }
  },
};
