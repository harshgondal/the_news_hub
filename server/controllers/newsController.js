import Article from '../models/Article.js';
import { updateNews } from '../services/newsService.js';
import { cacheHelpers } from '../config/redis.js';

// Get latest news
export const getLatestNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const articles = await Article.find()
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Article.countDocuments();
    
    res.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message
    });
  }
};

// Search news with fuzzy matching (WITH REDIS CACHING)
export const searchNews = async (req, res) => {
  try {
    const query = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // STEP 1: Create cache key (lowercase for consistency)
    const cacheKey = `search:${query.toLowerCase()}:page${page}:limit${limit}`;
    
    // STEP 2: Check Redis cache
    const cachedResult = await cacheHelpers.get(cacheKey);
    
    if (cachedResult) {
      console.log(`✅ Cache HIT for search: "${query}"`);
      return res.json(JSON.parse(cachedResult));
    }
    
    console.log(`❌ Cache MISS for search: "${query}"`);
    
    // STEP 3: Enhanced search with category priority
    // Use the full query as a phrase (case-insensitive)
    const searchRegex = new RegExp(query.trim(), 'i');
    const queryLower = query.toLowerCase().trim();
    
    // Check if query matches a category exactly
    const categoryKeywords = {
      'sports': ['sports', 'sport', 'cricket', 'football', 'tennis', 'hockey', 'basketball', 'athletics'],
      'technology': ['technology', 'tech', 'ai', 'software', 'hardware', 'internet', 'digital'],
      'business': ['business', 'economy', 'finance', 'market', 'stock', 'trade', 'corporate'],
      'entertainment': ['entertainment', 'movie', 'film', 'music', 'celebrity', 'bollywood', 'hollywood'],
      'health': ['health', 'medical', 'hospital', 'disease', 'doctor', 'medicine', 'covid'],
      'science': ['science', 'research', 'study', 'discovery', 'space', 'physics', 'chemistry'],
      'politics': ['politics', 'political', 'government', 'election', 'minister', 'parliament', 'policy'],
      'general': ['general', 'news', 'india', 'world']
    };
    
    // Find which category this query belongs to
    let matchedCategory = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.includes(queryLower)) {
        matchedCategory = category;
        break;
      }
    }
    
    let articles, total;
    
    if (matchedCategory) {
      // If query matches a category keyword, return ALL articles in that category
      // PLUS articles that match the specific keyword
      articles = await Article.find({
        $or: [
          { category: matchedCategory },
          { title: searchRegex },
          { description: searchRegex },
          { content: searchRegex },
          { source: searchRegex }
        ]
      })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      total = await Article.countDocuments({
        $or: [
          { category: matchedCategory },
          { title: searchRegex },
          { description: searchRegex },
          { content: searchRegex },
          { source: searchRegex }
        ]
      });
      
      console.log(`📂 Category-enhanced search: "${query}" → category: "${matchedCategory}" - Found ${total} articles`);
    } else {
      // For specific keywords (like "virat kohli"), use regex search
      // Note: $text cannot be used inside $or with other conditions
      articles = await Article.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { content: searchRegex },
          { category: searchRegex },
          { source: searchRegex }
        ]
      })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      total = await Article.countDocuments({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { content: searchRegex },
          { category: searchRegex },
          { source: searchRegex }
        ]
      });
      
      console.log(`🔍 Keyword search: "${query}" - Found ${total} articles`);
    }
    
    // STEP 4: Prepare response
    const response = {
      success: true,
      data: articles,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    // STEP 5: Cache the result (TTL: 5 minutes = 300 seconds)
    await cacheHelpers.setEx(
      cacheKey,
      300, // 5 minutes
      JSON.stringify(response)
    );
    
    console.log(`💾 Cached search result for: "${query}" (TTL: 5 min)`);
    
    res.json(response);
  } catch (error) {
    console.error('❌ Search error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: req.query.q
    });
    
    res.status(500).json({
      success: false,
      message: 'Error searching news',
      error: error.message
    });
  }
};

// Get news by category
export const getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const articles = await Article.find({ category })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Article.countDocuments({ category });
    
    res.json({
      success: true,
      data: articles,
      category,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news by category',
      error: error.message
    });
  }
};

// Get news by source
export const getNewsBySource = async (req, res) => {
  try {
    const { source } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const articles = await Article.find({ source })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Article.countDocuments({ source });
    
    res.json({
      success: true,
      data: articles,
      source,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news by source',
      error: error.message
    });
  }
};

// Get statistics
export const getStats = async (req, res) => {
  try {
    // Articles by category
    const categoryStats = await Article.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Articles by source
    const sourceStats = await Article.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Articles by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dateStats = await Article.aggregate([
      {
        $match: {
          publishedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Total articles
    const totalArticles = await Article.countDocuments();
    
    // Recent articles count (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentArticles = await Article.countDocuments({
      publishedAt: { $gte: oneDayAgo }
    });
    
    // Trending topics (most common words in titles)
    const trendingTopics = await Article.aggregate([
      {
        $project: {
          words: { $split: ['$title', ' '] }
        }
      },
      { $unwind: '$words' },
      {
        $match: {
          words: { $not: { $in: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being'] } }
        }
      },
      {
        $group: {
          _id: { $toLower: '$words' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        totalArticles,
        recentArticles,
        categoryStats: categoryStats.map(stat => ({
          category: stat._id,
          count: stat.count
        })),
        sourceStats: sourceStats.map(stat => ({
          source: stat._id,
          count: stat.count
        })),
        dateStats: dateStats.map(stat => ({
          date: stat._id,
          count: stat.count
        })),
        trendingTopics: trendingTopics.map(topic => ({
          topic: topic._id,
          count: topic.count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Manually trigger news update
export const triggerNewsUpdate = async (req, res) => {
  try {
    console.log('📰 Manual news update triggered');
    const result = await updateNews();
    
    res.json({
      success: true,
      message: 'News update completed',
      data: result
    });
  } catch (error) {
    console.error('Manual update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating news',
      error: error.message
    });
  }
};

// Get all unique sources (for debugging)
export const getSources = async (req, res) => {
  try {
    const sources = await Article.distinct('source');
    const sourcesWithCount = await Article.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        sources: sources.sort(),
        sourcesWithCount: sourcesWithCount.map(s => ({
          source: s._id,
          count: s.count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sources',
      error: error.message
    });
  }
};
