import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client for Upstash
const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';

// Check if using Upstash (rediss:// protocol)
const isUpstash = redisUrl.startsWith('rediss://');

const redisClient = createClient({
  url: redisUrl,
  socket: {
    ...(isUpstash && {
      tls: true,
      rejectUnauthorized: true
    }),
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Too many reconnection attempts');
        return new Error('Redis reconnection failed');
      }
      return retries * 100; // Exponential backoff
    }
  }
});

// Event handlers
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('⚠️ Redis: Connection closed');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️ Running without Redis cache');
  }
};

// Helper function to check if Redis is connected
const isRedisConnected = () => {
  return redisClient.isOpen;
};

// Cache helper functions
export const cacheHelpers = {
  // Get from cache
  get: async (key) => {
    if (!isRedisConnected()) return null;
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  },

  // Set with TTL
  setEx: async (key, ttl, value) => {
    if (!isRedisConnected()) return false;
    try {
      await redisClient.setEx(key, ttl, value);
      return true;
    } catch (error) {
      console.error(`Redis SETEX error for key ${key}:`, error.message);
      return false;
    }
  },

  // Delete key(s)
  del: async (keys) => {
    if (!isRedisConnected()) return 0;
    try {
      if (Array.isArray(keys)) {
        return await redisClient.del(keys);
      }
      return await redisClient.del(keys);
    } catch (error) {
      console.error(`Redis DEL error:`, error.message);
      return 0;
    }
  },

  // Check if key exists
  exists: async (key) => {
    if (!isRedisConnected()) return 0;
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error.message);
      return 0;
    }
  },

  // Get keys by pattern
  keys: async (pattern) => {
    if (!isRedisConnected()) return [];
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error.message);
      return [];
    }
  },

  // Add to Set
  sAdd: async (key, members) => {
    if (!isRedisConnected()) return 0;
    try {
      if (Array.isArray(members)) {
        return await redisClient.sAdd(key, members);
      }
      return await redisClient.sAdd(key, members);
    } catch (error) {
      console.error(`Redis SADD error for key ${key}:`, error.message);
      return 0;
    }
  },

  // Check if member exists in Set
  sIsMember: async (key, member) => {
    if (!isRedisConnected()) return false;
    try {
      return await redisClient.sIsMember(key, member);
    } catch (error) {
      console.error(`Redis SISMEMBER error:`, error.message);
      return false;
    }
  },

  // Get all members of Set
  sMembers: async (key) => {
    if (!isRedisConnected()) return [];
    try {
      return await redisClient.sMembers(key);
    } catch (error) {
      console.error(`Redis SMEMBERS error for key ${key}:`, error.message);
      return [];
    }
  },

  // Set expiration time on a key (TTL in seconds)
  expire: async (key, seconds) => {
    if (!isRedisConnected()) return false;
    try {
      return await redisClient.expire(key, seconds);
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error.message);
      return false;
    }
  },

  // Get cache statistics
  getStats: async () => {
    if (!isRedisConnected()) {
      return { connected: false };
    }
    try {
      const dbSize = await redisClient.dbSize();
      const info = await redisClient.info('memory');
      return {
        connected: true,
        totalKeys: dbSize,
        memoryInfo: info
      };
    } catch (error) {
      console.error('Redis STATS error:', error.message);
      return { connected: false, error: error.message };
    }
  },

  // Clear all cache
  flushAll: async () => {
    if (!isRedisConnected()) return false;
    try {
      await redisClient.flushDb();
      console.log('🗑️ Redis cache cleared');
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error.message);
      return false;
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isRedisConnected()) {
    await redisClient.quit();
    console.log('👋 Redis connection closed');
  }
  process.exit(0);
});

export { redisClient, connectRedis, isRedisConnected };
export default redisClient;
