import axios from 'axios';
import Parser from 'rss-parser';
import Article from '../models/Article.js';
import { cacheHelpers } from '../config/redis.js';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure']
  }
});

// RSS Feed URLs for Indian newspapers
const RSS_FEEDS = {
  'The Hindu': {
    general: 'https://www.thehindu.com/news/national/feeder/default.rss',
    business: 'https://www.thehindu.com/business/feeder/default.rss',
    sports: 'https://www.thehindu.com/sport/feeder/default.rss',
    technology: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss'
  },
  'Times of India': {
    general: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    business: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms',
    sports: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',
    technology: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms'
  },
  'Hindustan Times': {
    general: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    business: 'https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml',
    sports: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml',
    technology: 'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml'
  },
  'Indian Express': {
    general: 'https://indianexpress.com/feed/',
    business: 'https://indianexpress.com/section/business/feed/',
    sports: 'https://indianexpress.com/section/sports/feed/',
    technology: 'https://indianexpress.com/section/technology/feed/'
  }
};

// Helper function to extract image URL
// const extractImageUrl = (item) => {
//   // Try different possible image fields
//   if (item.enclosure && item.enclosure.url) {
//     return item.enclosure.url;
//   }
//   if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
//     return item['media:content'].$.url;
//   }
//   if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
//     return item['media:thumbnail'].$.url;
//   }
//   // Default placeholder image
//   return 'https://via.placeholder.com/400x250?text=News+Article';
// };

// Fetch news from RSS feeds
// export const fetchNewsFromRSS = async () => {
//   const articles = [];
  
//   for (const [source, categories] of Object.entries(RSS_FEEDS)) {
//     for (const [category, feedUrl] of Object.entries(categories)) {
//       try {
//         console.log(`Fetching ${category} news from ${source}...`);
//         const feed = await parser.parseURL(feedUrl);
        
//         for (const item of feed.items.slice(0, 10)) { // Limit to 10 articles per feed
//           // Skip articles without title or description
//           const title = item.title?.trim();
//           const description = item.contentSnippet || item.description || item.content || '';
          
//           if (!title || !description.trim()) {
//             continue;
//           }
          
//           const article = {
//             title: title,
//             description: description,
//             source: source,
//             url: item.link || item.guid || '',
//             imageUrl: extractImageUrl(item),
//             publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
//             category: category,
//             content: item.content || item.contentSnippet || description
//           };
          
//           articles.push(article);
//         }
//       } catch (error) {
//         console.error(`Error fetching from ${source} (${category}):`, error.message);
//       }
//     }
//   }
  
//   return articles;
// };

// Helper function to detect category from article content
const detectCategory = (title, description, content) => {
  const text = `${title} ${description} ${content}`.toLowerCase();
  const titleText = (title || '').toLowerCase();
  
  // Strong indicators - if found in title, immediately categorize
  const strongIndicators = {
    politics: ['election', 'parliament', 'minister', 'president', 'government', 'military', 'war', 'israel', 'gaza', 'ukraine', 'protest', 'senate', 'congress'],
    sports: ['cricket', 'football', 'basketball', 'tennis', 'championship', 'tournament', 'olympics', 'fifa', 'ipl', 'nba'],
    health: ['covid', 'vaccine', 'pandemic', 'hospital', 'disease', 'medical'],
    finance: ['stock market', 'wall street', 'nasdaq', 'cryptocurrency', 'bitcoin'],
    entertainment: ['movie', 'film', 'actor', 'actress', 'hollywood', 'bollywood', 'netflix'],
    science: ['nasa', 'space', 'climate', 'research study', 'discovery'],
    business: ['merger', 'acquisition', 'ceo', 'startup'],
    technology: ['artificial intelligence', 'machine learning', 'silicon valley', 'tech company']
  };
  
  // Check strong indicators in title first
  for (const [category, indicators] of Object.entries(strongIndicators)) {
    for (const indicator of indicators) {
      if (titleText.includes(indicator)) {
        return category;
      }
    }
  }
  
  // Category keywords with weights
  const categoryKeywords = {
    politics: {
      keywords: ['politics', 'political', 'government', 'president', 'minister', 'election', 'vote', 'parliament', 'congress', 'senate', 'legislation', 'campaign', 'military', 'war', 'conflict', 'protest', 'demonstration', 'israel', 'gaza', 'ukraine', 'russia', 'nato', 'defense', 'army', 'navy', 'soldier', 'troops', 'killed', 'attack', 'strike'],
      weight: 3,
      minScore: 6
    },
    sports: {
      keywords: ['sport', 'game', 'match', 'player', 'team', 'football', 'cricket', 'basketball', 'tennis', 'soccer', 'championship', 'tournament', 'league', 'coach', 'athlete', 'olympics', 'fifa', 'ipl', 'nba', 'nfl', 'goal', 'score', 'win', 'defeat', 'stadium'],
      weight: 3,
      minScore: 6
    },
    health: {
      keywords: ['health', 'medical', 'doctor', 'hospital', 'disease', 'vaccine', 'medicine', 'patient', 'treatment', 'covid', 'virus', 'pandemic', 'healthcare', 'wellness', 'fitness', 'nutrition', 'therapy', 'drug', 'pharmaceutical'],
      weight: 2.5,
      minScore: 5
    },
    finance: {
      keywords: ['stock', 'market', 'trading', 'investment', 'finance', 'financial', 'bank', 'economy', 'economic', 'wall street', 'nasdaq', 'dow jones', 'cryptocurrency', 'bitcoin', 'forex', 'shares', 'investor', 'fund', 'capital', 'revenue', 'profit', 'earnings'],
      weight: 2,
      minScore: 4
    },
    entertainment: {
      keywords: ['movie', 'film', 'actor', 'actress', 'celebrity', 'music', 'singer', 'album', 'concert', 'hollywood', 'bollywood', 'tv show', 'series', 'netflix', 'streaming', 'entertainment', 'box office', 'premiere', 'award', 'oscar', 'grammy'],
      weight: 2,
      minScore: 4
    },
    science: {
      keywords: ['science', 'research', 'study', 'scientist', 'discovery', 'experiment', 'space', 'nasa', 'climate', 'environment', 'physics', 'chemistry', 'biology', 'astronomy', 'planet', 'galaxy', 'laboratory'],
      weight: 2,
      minScore: 4
    },
    business: {
      keywords: ['business', 'company', 'corporate', 'ceo', 'entrepreneur', 'industry', 'merger', 'acquisition', 'deal', 'partnership', 'brand', 'retail', 'consumer', 'manufacturing'],
      weight: 2,
      minScore: 4
    },
    technology: {
      keywords: ['software', 'hardware', 'smartphone', 'artificial intelligence', 'machine learning', 'silicon valley', 'coding', 'programming', 'developer', 'tech company', 'gadget', 'robotics', 'automation', 'app development'],
      weight: 1,
      minScore: 3
    }
  };
  
  // Count weighted keyword matches
  const scores = {};
  for (const [category, config] of Object.entries(categoryKeywords)) {
    const matchCount = config.keywords.filter(keyword => text.includes(keyword)).length;
    const titleMatchCount = config.keywords.filter(keyword => titleText.includes(keyword)).length;
    
    // Title matches count 5x more
    scores[category] = {
      score: (matchCount * config.weight) + (titleMatchCount * config.weight * 5),
      minRequired: config.minScore
    };
  }
  
  // Find category with highest score that meets minimum threshold
  let bestCategory = null;
  let bestScore = 0;
  
  for (const [category, data] of Object.entries(scores)) {
    if (data.score >= data.minRequired && data.score > bestScore) {
      bestScore = data.score;
      bestCategory = category;
    }
  }
  
  // Return best category or default to general
  return bestCategory || 'general';
};

// Fetch news using NewsAPI (alternative/backup method)
export const fetchNewsFromAPI = async () => {
  const apiKey = '3f3a4065f5a84bf2be1b35019dfc80a0';
  
  if (!apiKey) {
    console.log('NewsAPI key not configured, skipping API fetch');
    return [];
  }
  
  const articles = [];
  
  // Fetch from multiple categories for better coverage
  const categories = ['general', 'business', 'entertainment', 'technology', 'sports', 'health', 'science'];
  
  try {
    console.log('Fetching from NewsAPI with key:', apiKey.substring(0, 8) + '...');
    
    // Fetch articles from each category
    for (const category of categories) {
      try {
        console.log(`Fetching ${category} articles from NewsAPI...`);
        const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
          params: {
            country: 'us',
            category: category,
            apiKey: apiKey,
            pageSize: 10 // Limit per category to avoid quota issues
          }
        });
        
        console.log(`NewsAPI ${category} - Status: ${response.data.status}, Results: ${response.data.totalResults}`);
        
        if (response.data.articles && response.data.articles.length > 0) {
          let skippedCount = 0;
          
          for (const item of response.data.articles) {
            // Check for invalid articles
            const hasTitle = item.title && item.title.trim() && item.title !== '[Removed]';
            const hasDescription = item.description && item.description.trim() && item.description !== '[Removed]';
            const hasContent = item.content && item.content.trim() && item.content !== '[Removed]';
            
            // Skip articles without title or description/content
            if (!hasTitle || (!hasDescription && !hasContent)) {
              skippedCount++;
              continue;
            }
            
            // Detect category based on article content
            const detectedCategory = detectCategory(
              item.title || '',
              item.description || '',
              item.content || ''
            );
            
            const article = {
              title: item.title,
              description: item.description || item.content || '',
              source: item.source?.name || 'Unknown Source',
              url: item.url,
              imageUrl: item.urlToImage,
              publishedAt: new Date(item.publishedAt),
              category: detectedCategory,
              content: item.content || item.description || ''
            };
            
            articles.push(article);
          }
          
          console.log(`${category}: Added ${response.data.articles.length - skippedCount} articles, skipped ${skippedCount}`);
        }
      } catch (error) {
        console.error(`Error fetching ${category} from NewsAPI:`, error.message);
      }
    }
    
    console.log(`Total articles fetched: ${articles.length}`);
  } catch (error) {
    console.error('Error in fetchNewsFromAPI:', error.message);
    if (error.response) {
      console.error('NewsAPI Response Status:', error.response.status);
      console.error('NewsAPI Response Data:', error.response.data);
    }
  }
  
  return articles;
};

// Save articles to database (WITH REDIS CACHING for duplicate detection)
export const saveArticles = async (articles) => {
  let savedCount = 0;
  let skippedCount = 0;
  let invalidCount = 0;
  let cacheHits = 0;
  
  // STEP 1: Filter out invalid articles
  const validArticles = articles.filter(articleData => {
    if (!articleData.title || !articleData.title.trim() || 
        (!articleData.description && !articleData.content)) {
      invalidCount++;
      return false;
    }
    return true;
  });
  
  if (validArticles.length === 0) {
    console.log(`Rejected ${invalidCount} invalid articles`);
    return { savedCount, skippedCount, invalidCount, cacheHits };
  }
  
  // STEP 2: Get all URLs from valid articles
  const urls = validArticles.map(a => a.url).filter(Boolean);
  
  // STEP 3: Create cache keys for today and yesterday (NewsAPI fetches previous day's news)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayKey = `article_urls:${today.toISOString().split('T')[0]}`;
  const yesterdayKey = `article_urls:${yesterday.toISOString().split('T')[0]}`;
  
  console.log(`🔍 Checking cache keys: ${todayKey} and ${yesterdayKey}`);
  
  // STEP 4: Check Redis cache for existing URLs in BOTH today and yesterday (BULK CHECK)
  const cacheChecks = await Promise.all(
    urls.map(async (url) => {
      const inToday = await cacheHelpers.sIsMember(todayKey, url);
      const inYesterday = await cacheHelpers.sIsMember(yesterdayKey, url);
      return inToday || inYesterday;
    })
  );
  
  // STEP 5: Create Set of cached URLs for O(1) lookup
  const cachedUrls = new Set();
  urls.forEach((url, index) => {
    if (cacheChecks[index]) {
      cachedUrls.add(url);
      cacheHits++;
    }
  });
  
  console.log(`📦 Redis cache: ${cacheHits}/${urls.length} URLs found in cache (today + yesterday)`);
  
  // STEP 6: Filter out cached articles (already exist)
  const uncachedArticles = validArticles.filter(article => {
    if (cachedUrls.has(article.url)) {
      skippedCount++;
      return false; // Skip cached (duplicate)
    }
    return true;
  });
  
  if (uncachedArticles.length === 0) {
    console.log(`Skipped ${skippedCount} duplicates (all from cache), rejected ${invalidCount} invalid articles`);
    return { savedCount, skippedCount, invalidCount, cacheHits };
  }
  
  // STEP 7: For remaining articles, check MongoDB (fallback)
  const uncachedUrls = uncachedArticles.map(a => a.url);
  console.log(`🔍 Checking ${uncachedUrls.length} URLs in MongoDB...`);
  
  const existingArticles = await Article.find({ 
    url: { $in: uncachedUrls } 
  }).select('url').lean();
  
  console.log(`📊 Found ${existingArticles.length} existing articles in MongoDB`);
  
  const existingUrlsSet = new Set(existingArticles.map(a => a.url));
  
  // STEP 8: Filter out articles that exist in DB but not in cache
  const articlesToSave = uncachedArticles.filter(article => {
    if (existingUrlsSet.has(article.url)) {
      skippedCount++;
      // Add to today's cache for next time (with 48h TTL to cover today + tomorrow)
      cacheHelpers.sAdd(todayKey, article.url).then(() => {
        cacheHelpers.expire(todayKey, 172800); // 48 hours = 172800 seconds
      });
      return false;
    }
    return true;
  });
  
  console.log(`💾 Articles to save: ${articlesToSave.length}, Skipped: ${skippedCount}`);
  
  // STEP 9: Bulk insert new articles
  if (articlesToSave.length > 0) {
    try {
      await Article.insertMany(articlesToSave, { ordered: false });
      savedCount = articlesToSave.length;
      
      // STEP 10: Add new article URLs to today's Redis cache with 48h TTL
      const newUrls = articlesToSave.map(a => a.url);
      if (newUrls.length > 0) {
        await cacheHelpers.sAdd(todayKey, newUrls);
        await cacheHelpers.expire(todayKey, 172800); // 48 hours (today + tomorrow)
        console.log(`✅ Added ${newUrls.length} URLs to Redis cache (expires in 48h)`);
      }
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - some articles already exist
        console.log('⚠️ Some duplicate articles detected during insert');
      } else {
        console.error('Error saving articles:', error.message);
      }
    }
  }
  
  console.log(`Saved ${savedCount} new articles, skipped ${skippedCount} duplicates (${cacheHits} from cache), rejected ${invalidCount} invalid articles`);
  return { savedCount, skippedCount, invalidCount, cacheHits };
};

// Main function to update news
export const updateNews = async () => {
  console.log('Starting news update...');
  
  try {
    // Fetch from RSS feeds
    // const rssArticles = await fetchNewsFromRSS();
    // console.log(`Fetched ${rssArticles.length} articles from RSS feeds`);
    
    // Optionally fetch from NewsAPI
    const apiArticles = await fetchNewsFromAPI();
    console.log(`Fetched ${apiArticles.length} articles from NewsAPI`);
    
    // Combine and save
    const allArticles = [ ...apiArticles];
    const result = await saveArticles(allArticles);
    
    console.log('News update completed');
    return result;
  } catch (error) {
    console.error('Error updating news:', error);
    throw error;
  }
};
