import axios from 'axios';
import Event from '../models/Event.js';
import { redisClient as redis } from '../config/redis.js';

// TheSportsDB - Free API, no key required for basic tier
const SPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// Popular league IDs for sports events
// Note: TheSportsDB free tier has limited data. Only most active leagues included.
const LEAGUES = {
  // Cricket - Only IPL has reliable data in free tier
  'IPL': '4413',
  'BIG_BASH': '4424',
  // Football - Most active leagues
  'PREMIER_LEAGUE': '4328',
  'LA_LIGA': '4335',
  'SERIE_A': '4332',
  'BUNDESLIGA': '4331',
  'CHAMPIONS_LEAGUE': '4480',
  // Basketball
  'NBA': '4387',
  // Tennis - Grand Slams
  'WIMBLEDON': '4469',
  'US_OPEN_TENNIS': '4510',
  'AUSTRALIAN_OPEN': '4468',
  // Formula 1
  'FORMULA_1': '4370',
  // American Football
  'NFL': '4391'
};

// Fetch next events for a specific league
const fetchLeagueEvents = async (leagueId, leagueName) => {
  try {
    const response = await axios.get(
      `${SPORTSDB_BASE_URL}/eventsnextleague.php?id=${leagueId}`
    );

    if (!response.data.events) {
      console.log(`⚠️ No upcoming events for ${leagueName} (ID: ${leagueId})`);
      return [];
    }

    const eventCount = response.data.events.length;
    console.log(`✅ ${leagueName}: Found ${eventCount} events`);
    
    return response.data.events.map(event => ({
      ...event,
      leagueName
    }));
  } catch (error) {
    if (error.response?.status === 401) {
      console.error(`❌ ${leagueName}: Authentication error (401) - TheSportsDB free tier might require API key now`);
    } else {
      console.error(`❌ Error fetching ${leagueName} (ID: ${leagueId}):`, error.message);
    }
    return [];
  }
};

// Transform SportsDB event to our Event model
const transformSportsEvent = (sportsEvent) => {
  try {
    // Parse date - handle multiple date formats
    let eventDate;
    
    if (sportsEvent.strTimestamp) {
      // Try parsing timestamp directly
      eventDate = new Date(sportsEvent.strTimestamp);
    } else if (sportsEvent.dateEvent) {
      // Parse date with time
      const timeStr = sportsEvent.strTime || '00:00:00';
      eventDate = new Date(`${sportsEvent.dateEvent}T${timeStr}Z`);
    }
    
    // Validate dates
    if (!eventDate || isNaN(eventDate.getTime())) {
      return null;
    }
    
    // Skip events older than 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0);
    
    if (eventDate < oneDayAgo) {
      return null; // Skip old events
    }

    // Category is always sports for TheSportsDB, default to 'general' if undefined
    let category = 'sports';
    if (!category || category === 'undefined') {
      category = 'general';
    }

    // Get event type from sport name
    const sportType = sportsEvent.strSport || 'Sports';
    
    // Determine event type based on sport
    let eventType = sportType;
    if (sportType.toLowerCase().includes('soccer') || sportType.toLowerCase().includes('football')) {
      eventType = 'Soccer Match';
    } else if (sportType.toLowerCase().includes('basketball')) {
      eventType = 'Basketball Game';
    } else if (sportType.toLowerCase().includes('formula')) {
      eventType = 'Formula 1 Race';
    } else if (sportType.toLowerCase().includes('cricket')) {
      eventType = 'Cricket Match';
    } else if (sportType.toLowerCase().includes('tennis')) {
      eventType = 'Tennis Match';
    } else if (sportType.toLowerCase().includes('baseball')) {
      eventType = 'Baseball Game';
    } else {
      eventType = `${sportType} Event`;
    }

    // Get participants (teams/players)
    const participants = [
      sportsEvent.strHomeTeam,
      sportsEvent.strAwayTeam
    ].filter(Boolean);

    // Build title
    const title = sportsEvent.strEvent || 
                  `${sportsEvent.strHomeTeam || ''} vs ${sportsEvent.strAwayTeam || ''}`.trim();

    // Location and venue
    const venue = sportsEvent.strVenue || '';
    const location = sportsEvent.strCountry || '';

    // Description
    const description = sportsEvent.strDescriptionEN || 
                       `${sportsEvent.leagueName || sportType} event`;

    // Image
    const imageUrl = sportsEvent.strThumb || 
                     sportsEvent.strPoster || 
                     sportsEvent.strSquare || '';

    // League/Source
    const source = sportsEvent.strLeague || sportsEvent.leagueName || 'TheSportsDB';

    // Status
    let status = 'upcoming';
    if (sportsEvent.strStatus === 'Match Finished') {
      status = 'completed';
    } else if (sportsEvent.strStatus === 'In Progress') {
      status = 'ongoing';
    }

    // Priority based on league importance
    let priority = 5;
    if (sportsEvent.strLeague?.includes('World Cup')) priority = 10;
    else if (sportsEvent.strLeague?.includes('Champions League')) priority = 9;
    else if (sportsEvent.strLeague?.includes('Premier League')) priority = 8;
    else if (sportsEvent.strLeague?.includes('NBA')) priority = 8;

    return {
      title,
      description,
      category,
      eventType,
      eventDate,
      location,
      venue,
      participants,
      imageUrl,
      sourceUrl: `https://www.thesportsdb.com/event/${sportsEvent.idEvent}`,
      source,
      priority,
      isLive: status === 'ongoing',
      status,
      tags: [
        sportsEvent.strSport,
        sportsEvent.strLeague,
        'sports'
      ].filter(Boolean)
    };
  } catch (error) {
    console.error('Error transforming sports event:', error);
    return null;
  }
};

// Fetch all sports events from multiple leagues
export const fetchSportsEvents = async () => {
  try {
    console.log('🏆 Fetching sports events from TheSportsDB...');
    console.log(`📋 Checking ${Object.keys(LEAGUES).length} leagues...`);
    
    const allEvents = [];
    let successCount = 0;
    let emptyCount = 0;

    // Fetch events from all major leagues
    for (const [name, id] of Object.entries(LEAGUES)) {
      const events = await fetchLeagueEvents(id, name.replace(/_/g, ' '));
      if (events.length > 0) {
        allEvents.push(...events);
        successCount++;
      } else {
        emptyCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 TheSportsDB Summary:`);
    console.log(`   ✅ Leagues with events: ${successCount}`);
    console.log(`   ⚠️ Leagues without events: ${emptyCount}`);
    console.log(`   📅 Total events found: ${allEvents.length}`);
    
    if (successCount === 0) {
      console.log(`\n⚠️ Note: TheSportsDB free tier has limited data.`);
      console.log(`   For more cricket events, ensure Ticketmaster API key is configured.`);
    }
    console.log('');
    
    return allEvents;
  } catch (error) {
    console.error('Error fetching sports events:', error);
    throw error;
  }
};

// Save sports events to database (with Redis caching)
export const saveSportsEventsToDatabase = async (sportsEvents) => {
  try {
    let savedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Generate cache keys for all events
    const eventKeys = sportsEvents.map(e => 
      `event:sportsdb:${e.idEvent || e.strEvent}:${e.dateEvent}`
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

    for (let i = 0; i < sportsEvents.length; i++) {
      const sportsEvent = sportsEvents[i];
      try {
        // Skip if in cache
        if (cachedEvents[i]) {
          skippedCount++;
          continue;
        }

        const transformedEvent = transformSportsEvent(sportsEvent);
        
        if (!transformedEvent) {
          skippedCount++;
          continue;
        }

        // Validate date before querying
        if (!transformedEvent.eventDate || isNaN(new Date(transformedEvent.eventDate).getTime())) {
          console.log(`Invalid date for event: ${transformedEvent.title}`);
          errorCount++;
          continue;
        }

        // Check if event already exists
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
        console.error(`Error processing event: ${sportsEvent.strEvent || 'Unknown'}`, eventError.message);
        errorCount++;
        continue;
      }
    }

    console.log(`✅ Sports events - Saved: ${savedCount}, Updated: ${skippedCount}, Errors: ${errorCount}`);
    return { savedCount, skippedCount, errorCount };
  } catch (error) {
    console.error('Error saving sports events:', error);
    throw error;
  }
};

// Main update function
export const updateSportsEvents = async () => {
  try {
    console.log('🏅 Starting sports events update...');
    
    const sportsEvents = await fetchSportsEvents();
    
    if (sportsEvents.length === 0) {
      console.log('⚠️ No sports events found from TheSportsDB');
      return { savedCount: 0, skippedCount: 0, errorCount: 0 };
    }

    const result = await saveSportsEventsToDatabase(sportsEvents);
    
    console.log('✨ Sports events update completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Error updating sports events:', error.message);
    // Don't throw - return error result instead
    return { savedCount: 0, skippedCount: 0, errorCount: 1, error: error.message };
  }
};

// Get today's live matches
export const fetchLiveMatches = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(
      `${SPORTSDB_BASE_URL}/eventsday.php?d=${today}&s=Soccer`
    );

    return response.data.events || [];
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
};
