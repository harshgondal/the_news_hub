# 📰 News Aggregator App

A full-stack news aggregation platform that fetches, categorizes, and displays news from multiple sources. Features AI-powered article analysis, upcoming events tracking, user authentication, and automated updates.

---

## ✨ Features Implemented

### 🔍 **Multi-Source News Aggregation**
Fetches news from RSS feeds and NewsAPI with automatic categorization and Redis-powered duplicate detection (20-500x faster).

### 🎫 **Upcoming Events Tracking**
Integrated with Ticketmaster and TheSportsDB APIs for real-time event tracking with smart filtering and automatic status updates.

### 🤖 **AI-Powered Analysis**
Google Gemini AI integration for article analysis, sentiment detection, and interactive chat functionality.

### 🔐 **User Features**
JWT authentication, Instagram-style bookmarks, personal dashboard, and saved articles management.

### ⚡ **Performance**
Redis caching, automated cleanup, scheduled updates (5x/day), and graceful fallbacks for optimal performance.

---

## 📦 Tech Stack

**Frontend:** React, TypeScript, Vite, TailwindCSS, Framer Motion, Axios  
**Backend:** Node.js, Express.js, MongoDB, Redis, JWT, Node-Cron  
**APIs:** NewsAPI, Ticketmaster, TheSportsDB, Google Gemini AI  

---

## 📁 Project Structure

```
News-App/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       └── api/
└── server/          # Node.js backend
    ├── controllers/
    ├── models/
    ├── routes/
    └── services/
```

---

## 🚀 Setup Instructions

### **Prerequisites**
Make sure Node.js, MongoDB, and Redis are installed.

### **1. Clone the Repository**
```bash
git clone https://github.com/harshgondal/News-App.git
cd News-App
```

### **2. Backend Setup**
```bash
cd server
npm install
```

Create `.env` file:
```env
PORT=you port number
MONGODB_URI=mongodb_url
REDIS_URL=your_redis_url
JWT_SECRET=your-jwt-secret
NEWS_API_KEY=your_newsapi_key
TICKETMASTER_API_KEY=your_ticketmaster_key
GEMINI_API_KEY=your_gemini_key
CLIENT_URL=http://localhost:5173
```

### **3. Frontend Setup**
```bash
cd ../client
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### **4. Start Services**
```bash
# Start MongoDB
mongod

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine

# Start Backend
cd server && npm run dev

# Start Frontend (new terminal)
cd client && npm run dev
```

### **5. Access the App**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api

---

## 🔧 Quick Commands

```bash

# Clear event cache
node server/scripts/clearEventCache.js


## 📅 Automated Features

- **News Updates:** 5x/day 
- **Event Updates:** 5x/day
- **Daily Cleanup:**

---

## 🎯 Key Features

✅ Multi-source news aggregation  
✅ AI-powered article analysis  
✅ Event tracking (sports & entertainment)  
✅ User authentication & bookmarks  
✅ Redis caching (20-500x faster)  
✅ Dark mode support  
✅ Responsive design  
✅ Automated scheduled updates  

---

## 👨‍💻 Author

**Harsh Gondal**  
GitHub: [@harshgondal](https://github.com/harshgondal)

---

**⭐ Star this repo if you found it helpful!**
