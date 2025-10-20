import axios from 'axios';
import Event from '../models/Event.js';
import { redisClient as redis } from '../config/redis.js';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

// Map Ticketmaster categories to our event categories
const categoryMapping = {
  'Sports': 'sports',
  'Music': 'entertainment',
  'Arts & Theatre': 'entertainment',
  'Film': 'entertainment',
  'Miscellaneous': 'general',
  'Family': 'general',
  'Business & Tech': 'technology'
};

// Map Ticketmaster classification to our event types
const getEventType = (classifications) => {
  if (!classifications || !classifications.length) return 'Event';
  
  const segment = classifications[0]?.segment?.name || '';
  const genre = classifications[0]?.genre?.name || '';
  
  if (segment === 'Sports') {
    return genre || 'Sports Event';
  } else if (segment === 'Music') {
    return genre || 'Concert';
  } else if (segment === 'Arts & Theatre') {
    return 'Theater';
  }
  
  return segment || 'Event';
};

// Fetch events from Ticketmaster API
export const fetchTicketmasterEvents = async (options = {}) => {
  try {
    if (!TICKETMASTER_API_KEY) {
      throw new Error('Ticketmaster API key is not configured');
    }

    const {
      countryCode = 'US,GB,IN,AU,CA', // Multiple countries
      size = 100, // Number of events to fetch
      daysAhead = 14
    } = options;

    // Start from yesterday to catch events that might have ended today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const startDateTime = startDate.toISOString().split('T')[0] + 'T00:00:00Z';

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);
    const endDateTime = endDate.toISOString().split('T')[0] + 'T23:59:59Z';

    console.log(`🎫 Fetching events from Ticketmaster (${startDateTime} to ${endDateTime})...`);

    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        countryCode,
        startDateTime,
        endDateTime,
        size,
        sort: 'date,asc'
      }
    });

    if (!response.data._embedded || !response.data._embedded.events) {
      console.log('No events found from Ticketmaster');
      return [];
    }

    const events = response.data._embedded.events;
    console.log(`Found ${events.length} events from Ticketmaster`);

    return events;
  } catch (error) {
    console.error('Error fetching from Ticketmaster API:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
};

// Transform Ticketmaster event to our Event model format
const transformTicketmasterEvent = (tmEvent) => {
  try {
    // Get category - default to 'general' if undefined or unmapped
    const tmSegment = tmEvent.classifications?.[0]?.segment?.name || 'Miscellaneous';
    let category = categoryMapping[tmSegment];
    
    // If category is undefined or invalid, set to 'general'
    if (!category || category === 'undefined') {
      category = 'general';
    }
    
    // Log unmapped categories to help with debugging
    if (!categoryMapping[tmSegment] && tmSegment !== 'Miscellaneous') {
      console.log(`⚠️ Unmapped Ticketmaster segment: "${tmSegment}" for event: ${tmEvent.name}`);
    }

    // Get event type
    const eventType = getEventType(tmEvent.classifications);

    // Get dates - validate before using
    const eventDate = new Date(tmEvent.dates.start.dateTime || tmEvent.dates.start.localDate);
    
    // Validate event date
    if (!eventDate || isNaN(eventDate.getTime())) {
      console.log(`Skipping event with invalid start date: ${tmEvent.name}`);
      return null;
    }
    
    // Skip events older than 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0);
    
    if (eventDate < oneDayAgo) {
      return null; // Skip old events
    }
    
    // Get end date if available and valid
    let endDate = null;
    if (tmEvent.dates.end) {
      const tempEndDate = new Date(tmEvent.dates.end.dateTime || tmEvent.dates.end.localDate);
      // Only set if valid
      if (tempEndDate && !isNaN(tempEndDate.getTime())) {
        endDate = tempEndDate;
      }
    }

    // Get location
    const venue = tmEvent._embedded?.venues?.[0];
    const location = venue ? `${venue.city?.name || ''}, ${venue.country?.name || ''}`.trim() : '';
    const venueName = venue?.name || '';

    // Get participants (attractions/performers)
    const participants = tmEvent._embedded?.attractions?.map(a => a.name) || [];

    // Get image
    const imageUrl = tmEvent.images?.[0]?.url || '';

    // Get price range for description
    let priceInfo = '';
    if (tmEvent.priceRanges && tmEvent.priceRanges.length > 0) {
      const minPrice = tmEvent.priceRanges[0].min;
      const maxPrice = tmEvent.priceRanges[0].max;
      const currency = tmEvent.priceRanges[0].currency;
      priceInfo = ` | Tickets: ${currency} ${minPrice}-${maxPrice}`;
    }

    // Build description
    const description = `${tmEvent.info || tmEvent.pleaseNote || 'Live event'}${priceInfo}`.substring(0, 500);

    // Priority based on event popularity/importance
    let priority = 5; // Default
    if (tmEvent.classifications?.[0]?.primary) priority += 2;
    if (participants.length > 3) priority += 1;
    if (tmEvent.dates.status?.code === 'onsale') priority += 1;

    return {
      title: tmEvent.name,
      description,
      category,
      eventType,
      eventDate,
      endDate,
      location,
      venue: venueName,
      participants,
      imageUrl,
      sourceUrl: tmEvent.url,
      source: 'Ticketmaster',
      priority,
      tags: [
        ...tmEvent.classifications?.map(c => c.genre?.name).filter(Boolean) || [],
        category,
        eventType
      ]
    };
  } catch (error) {
    console.error('Error transforming event:', error);
    return null;
  }
};

// Save events to database (avoid duplicates using Redis cache)
export const saveEventsToDatabase = async (ticketmasterEvents) => {
  try {
    let savedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Generate cache keys for all events
    const eventKeys = ticketmasterEvents.map(e => 
      `event:ticketmaster:${e.id || e.name}:${e.dates?.start?.dateTime || e.dates?.start?.localDate}`
    );

    // Check Redis cache for existing events
    let cachedEvents = [];
    if (redis && redis.isOpen) {
      try {
        const cachePromises = eventKeys.map(key => redis.exists(key));
        cachedEvents = await Promise.all(cachePromises);
      } catch (redisError) {
        console.log('Redis cache check failed, continuing without cache');
      }
    }

    for (let i = 0; i < ticketmasterEvents.length; i++) {
      const tmEvent = ticketmasterEvents[i];
      try {
        // Skip if in cache
        if (cachedEvents[i]) {
          skippedCount++;
          continue;
        }

        const transformedEvent = transformTicketmasterEvent(tmEvent);
        
        if (!transformedEvent) {
          skippedCount++;
          continue;
        }

        // Validate required fields before saving
        if (!transformedEvent.eventDate || isNaN(new Date(transformedEvent.eventDate).getTime())) {
          console.log(`Invalid date for event: ${transformedEvent.title}`);
          errorCount++;
          continue;
        }

        // Check if event already exists (by title and date)
        const existingEvent = await Event.findOne({
          title: transformedEvent.title,
          eventDate: transformedEvent.eventDate
        });

        if (existingEvent) {
          // Update existing event
          Object.assign(existingEvent, transformedEvent);
          await existingEvent.save();
          skippedCount++;
        } else {
          // Create new event
          const newEvent = new Event(transformedEvent);
          await newEvent.save();
          savedCount++;
        }

        // Add to Redis cache (expire after 7 days)
        if (redis && redis.isOpen) {
          try {
            await redis.setEx(eventKeys[i], 604800, '1'); // 7 days TTL
          } catch (redisError) {
            // Continue even if Redis fails
          }
        }
      } catch (eventError) {
        console.error(`Error processing event: ${tmEvent.name || 'Unknown'}`, eventError.message);
        errorCount++;
        continue;
      }
    }

    // Log category breakdown
    const categoryCounts = {};
    for (const tmEvent of ticketmasterEvents) {
      const transformed = transformTicketmasterEvent(tmEvent);
      if (transformed && transformed.category) {
        categoryCounts[transformed.category] = (categoryCounts[transformed.category] || 0) + 1;
      }
    }
    
    console.log(`✅ Ticketmaster events - Saved: ${savedCount}, Updated: ${skippedCount}, Errors: ${errorCount}`);
    console.log('📊 Category breakdown:', categoryCounts);
    return { savedCount, skippedCount, errorCount };
  } catch (error) {
    console.error('Error saving events to database:', error);
    return { savedCount: 0, skippedCount: 0, errorCount: 1, error: error.message };
  }
};

// Main function to update events
export const updateEvents = async () => {
  try {
    // Check if API key is configured
    if (!TICKETMASTER_API_KEY) {
      console.log('ℹ️ Ticketmaster API key not configured - skipping');
      return { savedCount: 0, skippedCount: 0, message: 'API key not configured' };
    }

    console.log('🎫 Starting Ticketmaster event update...');
    
    // Fetch events for the next 14 days
    const ticketmasterEvents = await fetchTicketmasterEvents({
      daysAhead: 14,
      size: 100
    });

    if (ticketmasterEvents.length === 0) {
      console.log('⚠️ No events found from Ticketmaster');
      return { savedCount: 0, skippedCount: 0 };
    }

    // Save to database
    const result = await saveEventsToDatabase(ticketmasterEvents);
    
    // Clean up old completed events (optional)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const deletedResult = await Event.deleteMany({
      eventDate: { $lt: yesterday },
      status: 'completed',
      source: 'Ticketmaster'
    });
    
    if (deletedResult.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletedResult.deletedCount} old Ticketmaster events`);
    }
    
    console.log('✨ Ticketmaster event update completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Error updating Ticketmaster events:', error.message);
    // Don't throw - return error result instead
    return { savedCount: 0, skippedCount: 0, error: error.message };
  }
};

// Fetch events by specific category
export const updateEventsByCategory = async (category) => {
  try {
    const classificationName = Object.keys(categoryMapping).find(
      key => categoryMapping[key] === category
    );

    if (!classificationName) {
      throw new Error(`Invalid category: ${category}`);
    }

    const ticketmasterEvents = await fetchTicketmasterEvents({
      daysAhead: 14,
      size: 50,
      classificationName
    });

    return await saveEventsToDatabase(ticketmasterEvents);
  } catch (error) {
    console.error(`Error updating ${category} events:`, error);
    throw error;
  }
};
