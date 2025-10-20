# News Aggregator Backend

Backend API for the Indian News Aggregator application.

## Features

- RESTful API built with Express.js
- MongoDB database with Mongoose ODM
- RSS feed parsing from multiple Indian newspapers
- Automated news fetching with cron jobs
- Full-text search capability
- Statistics and analytics endpoints
- CORS enabled for frontend integration

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the server directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/news-aggregator
NEWS_API_KEY=your_newsapi_key_here
NODE_ENV=development
```

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Get Latest News
```
GET /api/news?page=1&limit=20
```

### Search News
```
GET /api/news/search?q=finance&page=1&limit=20
```

### Get News by Category
```
GET /api/news/category/sports?page=1&limit=20
```

### Get News by Source
```
GET /api/news/source/The%20Hindu?page=1&limit=20
```

### Get Statistics
```
GET /api/stats
```

### Trigger Manual Update
```
POST /api/news/update
```

## Database Schema

### Article Model
```javascript
{
  title: String,
  description: String,
  source: String,
  url: String (unique),
  imageUrl: String,
  publishedAt: Date,
  category: String,
  content: String,
  timestamps: true
}
```

## News Sources

The backend fetches from RSS feeds of:
- The Hindu
- Times of India
- Hindustan Times
- Indian Express

## Cron Jobs

- News update runs every 2 hours
- Initial fetch runs 5 seconds after server startup

## Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- cors: CORS middleware
- dotenv: Environment variables
- axios: HTTP client
- node-cron: Task scheduler
- rss-parser: RSS feed parser
