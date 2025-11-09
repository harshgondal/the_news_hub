import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { createServer } from 'http';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initializeSocket } from './config/socket.js';
import newsRoutes from './routes/newsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import { updateNews } from './services/newsService.js';
import { updateSportsEvents } from './services/sportsEventsService.js';
import { updateEvents as updateTicketmasterEvents } from './services/ticketmasterService.js';
import { performCompleteCleanup } from './services/eventCleanupService.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173', // Local development
  process.env.CLIENT_URL, // Production frontend URL (Vercel)
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

// Add security headers for Google OAuth popup
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// Connect to Redis
connectRedis();

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', newsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'News Aggregator API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Schedule news updates 5 times a day (every ~5 hours: 6am, 11am, 4pm, 9pm, 2am)
cron.schedule('0 6,11,16,21,2 * * *', async () => {
  console.log('Running scheduled news update...');
  try {
    await updateNews();
  } catch (error) {
    console.error('Scheduled update failed:', error);
  }
});

// Schedule event updates 5 times a day (every ~5 hours: 7am, 12pm, 5pm, 10pm, 3am)
cron.schedule('0 7,12,17,22,3 * * *', async () => {
  console.log('Running scheduled event update from all sources...');
  
  // Fetch from TheSportsDB
  try {
    const sportsResult = await updateSportsEvents();
    console.log(`TheSportsDB - Saved: ${sportsResult.savedCount}, Updated: ${sportsResult.skippedCount}`);
  } catch (error) {
    console.error('TheSportsDB update failed:', error.message);
  }
  
  // Fetch from Ticketmaster
  try {
    const ticketmasterResult = await updateTicketmasterEvents();
    if (ticketmasterResult.message !== 'API key not configured') {
      console.log(`Ticketmaster - Saved: ${ticketmasterResult.savedCount}, Updated: ${ticketmasterResult.skippedCount}`);
    }
  } catch (error) {
    console.error('Ticketmaster update failed:', error.message);
  }
});

// Schedule event cleanup daily at midnight (removes completed events older than 1 day)
cron.schedule('0 0 * * *', async () => {
  console.log('🌙 Running daily midnight cleanup...');
  try {
    await performCompleteCleanup();
  } catch (error) {
    console.error('Scheduled cleanup failed:', error.message);
  }
});

// Initial news fetch on startup
setTimeout(async () => {
  console.log('Performing initial news fetch...');
  try {
    await updateNews();
  } catch (error) {
    console.error('Initial news fetch failed:', error);
  }
}, 5000); // Wait 5 seconds after startup

// Initial event fetch from all sources on startup
setTimeout(async () => {
  console.log('🎫 Performing initial event fetch from all sources...');
  
  // First, cleanup old events from database
  try {
    console.log('🧹 Cleaning up old events...');
    await performCompleteCleanup();
  } catch (error) {
    console.error('⚠️ Initial cleanup failed:', error.message);
  }
  
  // Fetch from TheSportsDB
  try {
    const sportsResult = await updateSportsEvents();
    if (sportsResult.savedCount > 0) {
      console.log(`✅ TheSportsDB: Fetched ${sportsResult.savedCount} sports events`);
    }
  } catch (error) {
    console.error('⚠️ TheSportsDB fetch failed:', error.message);
  }
  
  // Fetch from Ticketmaster
  try {
    const ticketmasterResult = await updateTicketmasterEvents();
    if (ticketmasterResult.message === 'API key not configured') {
      console.log('ℹ️ Ticketmaster: No API key configured (optional - add TICKETMASTER_API_KEY to .env for more events)');
    } else if (ticketmasterResult.savedCount > 0 || ticketmasterResult.skippedCount > 0) {
      const total = ticketmasterResult.savedCount + ticketmasterResult.skippedCount;
      console.log(`✅ Ticketmaster: Fetched ${total} events (${ticketmasterResult.savedCount} new, ${ticketmasterResult.skippedCount} updated)`);
    } else {
      console.log('⚠️ Ticketmaster: No events found');
    }
  } catch (error) {
    console.error('⚠️ Ticketmaster fetch failed:', error.message);
  }
}, 10000); // Wait 10 seconds after startup

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.io initialized for real-time updates`);
});
