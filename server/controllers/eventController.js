import Event from '../models/Event.js';
import { updateEvents } from '../services/ticketmasterService.js';
import { updateSportsEvents } from '../services/sportsEventsService.js';

// Get upcoming events (today and next N days) - EXCLUDE completed
export const getUpcomingEvents = async (req, res) => {
  try {
    const { days = 7, category, limit = 20 } = req.query;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    futureDate.setHours(23, 59, 59, 999);
    
    const query = {
      eventDate: { $gte: now, $lte: futureDate },
      status: { $in: ['upcoming', 'ongoing'] } // EXCLUDE completed
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    console.log(`📅 Upcoming Query: category=${category}, days=${days}`);
    
    const events = await Event.find(query)
      .sort({ eventDate: 1, priority: -1 })
      .limit(parseInt(limit));
    
    console.log(`📊 Found ${events.length} upcoming events`);
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events',
      error: error.message
    });
  }
};

// Get events by date range
export const getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    const query = {
      eventDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const events = await Event.find(query)
      .sort({ eventDate: 1, priority: -1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// Get events happening today - EXCLUDE completed
export const getTodayEvents = async (req, res) => {
  try {
    const { category } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const query = {
      eventDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['upcoming', 'ongoing'] } // EXCLUDE completed
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    console.log(`📅 Today Query: category=${category}`);
    
    const events = await Event.find(query)
      .sort({ priority: -1, eventDate: 1 });
    
    console.log(`📊 Found ${events.length} events for today`);
    
    // Log category breakdown
    const categoryCounts = {};
    events.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    console.log('Category breakdown:', categoryCounts);
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching today events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today events',
      error: error.message
    });
  }
};

// Get events happening tomorrow - EXCLUDE completed
export const getTomorrowEvents = async (req, res) => {
  try {
    const { category } = req.query;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const query = {
      eventDate: { $gte: tomorrow, $lt: dayAfter },
      status: { $in: ['upcoming', 'ongoing'] } // EXCLUDE completed
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    console.log(`📅 Tomorrow Query: category=${category}`);
    
    const events = await Event.find(query)
      .sort({ priority: -1, eventDate: 1 });
    
    console.log(`📊 Found ${events.length} events for tomorrow`);
    
    // Log category breakdown
    const categoryCounts = {};
    events.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    console.log('Category breakdown:', categoryCounts);
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching tomorrow events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tomorrow events',
      error: error.message
    });
  }
};

// Get completed events (from yesterday onwards)
export const getCompletedEvents = async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0);
    
    const query = {
      status: 'completed',
      $or: [
        { eventDate: { $gte: oneDayAgo } }, // Event started yesterday or later
        { endDate: { $gte: oneDayAgo } } // Event ended yesterday or later
      ]
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    console.log(`📅 Completed Query: category=${category}`);
    
    const events = await Event.find(query)
      .sort({ endDate: -1, eventDate: -1 }) // Most recently ended first
      .limit(parseInt(limit));
    
    console.log(`📊 Found ${events.length} completed events`);
    
    // Log category breakdown
    const categoryCounts = {};
    events.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    console.log('Category breakdown:', categoryCounts);
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching completed events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching completed events',
      error: error.message
    });
  }
};

// Get live/ongoing events
export const getLiveEvents = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = {
      status: 'ongoing',
      isLive: true
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const events = await Event.find(query)
      .sort({ priority: -1, eventDate: 1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching live events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live events',
      error: error.message
    });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

// Create new event (Admin only - you can add auth middleware)
export const createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Update event (Admin only)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
};

// Delete event (Admin only)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};

// Get events grouped by date
export const getEventsGroupedByDate = async (req, res) => {
  try {
    const { days = 7, category } = req.query;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    futureDate.setHours(23, 59, 59, 999);
    
    const query = {
      eventDate: { $gte: now, $lte: futureDate },
      status: { $in: ['upcoming', 'ongoing'] }
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const events = await Event.find(query)
      .sort({ eventDate: 1, priority: -1 });
    
    // Group events by date
    const groupedEvents = {};
    events.forEach(event => {
      const dateKey = new Date(event.eventDate).toDateString();
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });
    
    res.json({
      success: true,
      count: events.length,
      data: groupedEvents
    });
  } catch (error) {
    console.error('Error fetching grouped events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grouped events',
      error: error.message
    });
  }
};

// Manually fetch and update events from Ticketmaster (Admin only)
export const fetchEventsFromTicketmaster = async (req, res) => {
  try {
    console.log('Manual event fetch triggered...');
    const result = await updateEvents();
    
    res.json({
      success: true,
      message: 'Events fetched and saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching events from Ticketmaster:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events from Ticketmaster',
      error: error.message
    });
  }
};

// Fetch sports events from TheSportsDB (No API key required)
export const fetchSportsEventsFromAPI = async (req, res) => {
  try {
    console.log('Fetching sports events from TheSportsDB...');
    const result = await updateSportsEvents();
    
    res.json({
      success: true,
      message: 'Sports events fetched and saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching sports events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sports events',
      error: error.message
    });
  }
};

// Get event statistics (for debugging)
export const getEventStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    
    // Count by category
    const categoryStats = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count by source
    const sourceStats = await Event.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count by status
    const statusStats = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalEvents,
        byCategory: categoryStats,
        bySource: sourceStats,
        byStatus: statusStats
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event stats',
      error: error.message
    });
  }
};
