import { connectDB } from '../config/db.js';
import { connectRedis, redisClient } from '../config/redis.js';
import { clearEventCache } from '../services/eventCleanupService.js';

/**
 * Manual script to clear Redis event cache
 * Run this after deleting the database to ensure cache is in sync
 */

const clearCache = async () => {
  try {
    console.log('🚀 Starting manual cache clear...\n');
    
    // Connect to Redis
    await connectRedis();
    
    // Wait a bit for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!redisClient || !redisClient.isOpen) {
      console.error('❌ Redis connection failed');
      process.exit(1);
    }
    
    // Clear event cache
    const result = await clearEventCache();
    
    console.log(`\n✅ Cache clear completed!`);
    console.log(`   Cleared ${result.cleared} event keys`);
    
    // Close connections
    await redisClient.quit();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearCache();
