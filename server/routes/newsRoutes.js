import express from 'express';
import {
  getLatestNews,
  searchNews,
  getNewsByCategory,
  getNewsBySource,
  getStats,
  triggerNewsUpdate,
  getSources
} from '../controllers/newsController.js';

const router = express.Router();

// GET /api/news - Get latest news
router.get('/', getLatestNews);

// GET /api/news/search?q=query - Search news
router.get('/search', searchNews);

// GET /api/news/sources - Get all unique sources (debugging)
router.get('/sources', getSources);

// GET /api/news/category/:category - Get news by category
router.get('/category/:category', getNewsByCategory);

// GET /api/news/source/:source - Get news by source
router.get('/source/:source', getNewsBySource);

// GET /api/stats - Get statistics
router.get('/stats', getStats);

// POST /api/news/update - Manually trigger news update
router.post('/update', triggerNewsUpdate);

export default router;
