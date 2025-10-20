# News Aggregator Frontend

React frontend for the Indian News Aggregator application.

## Features

- Modern, responsive UI with Tailwind CSS
- Dark mode support
- Three main pages: Home, Search, Dashboard
- Interactive charts with Recharts
- Category filtering
- Pagination
- Real-time search

## Installation

```bash
npm install
```

## Running the App

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── api/           # API configuration (axios)
├── components/    # Reusable components
│   ├── Navbar.jsx
│   ├── NewsCard.jsx
│   ├── LoadingSpinner.jsx
│   ├── ErrorMessage.jsx
│   └── CategoryFilter.jsx
├── hooks/         # Custom hooks
│   └── useDarkMode.js
├── pages/         # Page components
│   ├── Home.jsx
│   ├── Search.jsx
│   └── Dashboard.jsx
├── App.jsx        # Main app component
├── main.jsx       # Entry point
└── index.css      # Global styles
```

## Technologies

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Recharts
- Lucide React (icons)

## Configuration

The app expects the backend API to be running on `http://localhost:5000`. This can be changed in `src/api/axios.js`.

## Features

### Home Page
- Latest news from all sources
- Category filtering
- Pagination
- Responsive grid layout

### Search Page
- Full-text search
- Suggested searches
- Search results with pagination

### Dashboard Page
- Total articles statistics
- Articles by category (bar chart)
- Articles by source (pie chart)
- Articles over time (line chart)
- Trending topics

### Dark Mode
- Toggle between light and dark themes
- Preference saved in localStorage
- Smooth transitions
