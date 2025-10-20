import Event from '../models/Event.js';
import { redisClient as redis } from '../config/redis.js';

/**
 * Clear Redis event cache
 * Call this after deleting database to ensure cache is in sync
 */
export const clearEventCache = async () => {
  try {
    if (!redis || !redis.isOpen) {
      console.log('⚠️ Redis not available, skipping cache clear');
      return { cleared: 0 };
    }

    console.log('🧹 Clearing Redis event cache...');
    
    // Get all event cache keys
    const ticketmasterKeys = await redis.keys('event:ticketmaster:*');
    const sportsdbKeys = await redis.keys('event:sportsdb:*');
    const allKeys = [...ticketmasterKeys, ...sportsdbKeys];
    
    if (allKeys.length > 0) {
      await redis.del(allKeys);
      console.log(`✅ Cleared ${allKeys.length} cached event keys`);
    } else {
      console.log('ℹ️ No event cache keys to clear');
    }
    
    return { cleared: allKeys.length };
  } catch (error) {
    console.error('❌ Error clearing event cache:', error);
    return { cleared: 0 };
  }
};

/**
 * Clean up old events from the database
 * Keeps only:
 * - Upcoming events
 * - Ongoing events
 * - Events completed within the last 1 day
 */
export const cleanupOldEvents = async () => {
  try {
    console.log('🧹 Starting event cleanup...');
    
    // Calculate cutoff date (1 day ago)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0);
    
    // Delete events that are:
    // 1. Completed AND older than 1 day
    // 2. Have eventDate older than 1 day AND status is completed
    const result = await Event.deleteMany({
      $or: [
        {
          status: 'completed',
          eventDate: { $lt: oneDayAgo }
        },
        {
          status: 'cancelled',
          eventDate: { $lt: oneDayAgo }
        },
        // Also delete events with very old dates regardless of status
        {
          eventDate: { $lt: oneDayAgo },
          endDate: { $lt: oneDayAgo }
        }
      ]
    });
    
    console.log(`✅ Cleanup complete: Removed ${result.deletedCount} old events`);
    
    // Get remaining event count
    const remainingCount = await Event.countDocuments();
    console.log(`📊 Remaining events in database: ${remainingCount}`);
    
    return {
      deletedCount: result.deletedCount,
      remainingCount
    };
  } catch (error) {
    console.error('❌ Error during event cleanup:', error);
    throw error;
  }
};

/**
 * Update event statuses based on current time
 * This ensures events are properly marked as ongoing/completed
 */
export const updateEventStatuses = async () => {
  try {
    console.log('🔄 Updating event statuses...');
    
    const now = new Date();
    let updatedCount = 0;
    
    // Find all events that might need status updates
    const events = await Event.find({
      $or: [
        { status: 'upcoming', eventDate: { $lte: now } },
        { status: 'ongoing', endDate: { $lte: now } }
      ]
    });
    
    for (const event of events) {
      const eventDate = new Date(event.eventDate);
      const endDate = event.endDate ? new Date(event.endDate) : eventDate;
      
      let needsUpdate = false;
      
      if (now >= eventDate && now <= endDate && event.status !== 'ongoing') {
        event.status = 'ongoing';
        event.isLive = true;
        needsUpdate = true;
      } else if (now > endDate && event.status !== 'completed') {
        event.status = 'completed';
        event.isLive = false;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await event.save();
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} event statuses`);
    return { updatedCount };
  } catch (error) {
    console.error('❌ Error updating event statuses:', error);
    throw error;
  }
};

/**
 * Complete cleanup routine - updates statuses and removes old events
 * NOTE: Does NOT clear cache - cache is used to prevent duplicate fetches
 */
export const performCompleteCleanup = async () => {
  try {
    console.log('🚀 Starting complete event cleanup routine...');
    
    // Update event statuses (upcoming -> ongoing -> completed)
    const statusResult = await updateEventStatuses();
    
    // Cleanup old completed events (older than 1 day)
    const cleanupResult = await cleanupOldEvents();
    
    console.log('✨ Complete cleanup finished successfully');
    
    return {
      statusUpdates: statusResult.updatedCount,
      eventsDeleted: cleanupResult.deletedCount,
      eventsRemaining: cleanupResult.remainingCount
    };
  } catch (error) {
    console.error('❌ Complete cleanup failed:', error);
    throw error;
  }
};
