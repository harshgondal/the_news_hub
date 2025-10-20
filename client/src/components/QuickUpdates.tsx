import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, RefreshCw, ArrowRight, Clock } from 'lucide-react';
import { Article } from '../types';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

type Category = 'all' | 'general' | 'technology' | 'business' | 'sports' | 'entertainment';

const QuickUpdates: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [headlines, setHeadlines] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchHeadlines();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchHeadlines(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedCategory]);

  const fetchHeadlines = async (isAutoRefresh = false) => {
    try {
      setLoading(true);
      
      let endpoint = '/news';
      const params = { page: 1, limit: 7 };
      
      if (selectedCategory !== 'all') {
        endpoint = `/news/category/${selectedCategory}`;
      }
      
      const response = await api.get(endpoint, { params });
      
      if (response.data.success) {
        const newHeadlines = response.data.data;
        
        // Check if there are new articles (compare with existing)
        if (isAutoRefresh && headlines.length > 0) {
          const hasNew = newHeadlines.some(
            (article: Article) => !headlines.find(h => h._id === article._id)
          );
          if (hasNew) {
            setHasNewUpdates(true);
          }
        }
        
        setHeadlines(newHeadlines);
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching quick updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setHasNewUpdates(false);
    fetchHeadlines();
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewUpdates(false);
  };

  const handleArticleClick = (article: Article) => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-500',
      technology: 'bg-purple-500',
      business: 'bg-green-500',
      sports: 'bg-orange-500',
      entertainment: 'bg-pink-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const categories: { value: Category; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '🌐' },
    { value: 'general', label: 'General', emoji: '📰' },
    { value: 'technology', label: 'Tech', emoji: '💻' },
    { value: 'business', label: 'Business', emoji: '💼' },
    { value: 'sports', label: 'Sports', emoji: '⚽' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' }
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all group ${
          hasNewUpdates ? 'animate-pulse ring-2 ring-blue-500/50' : ''
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Zap className="h-7 w-7 group-hover:rotate-12 transition-transform" />
        {hasNewUpdates && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          />
        )}
      </motion.button>

      {/* Quick Updates Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Popup Card */}
            <motion.div
              className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-48px)] max-h-[600px] bg-[#1e293b]/95 backdrop-blur-lg rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-700"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-300" />
                    <h3 className="text-lg font-bold text-white">Quick Updates</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleManualRefresh}
                      disabled={loading}
                      className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                      title="Refresh headlines"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center space-x-2 text-white/70 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>
                    Updated {formatDistanceToNow(lastFetchTime, { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center space-x-2 p-3 bg-slate-900/50 overflow-x-auto custom-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="mr-1">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Headlines List */}
              <div className="p-4 max-h-[420px] overflow-y-auto space-y-2 custom-scrollbar">
                {loading && headlines.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Loading updates...</p>
                  </div>
                ) : headlines.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">No headlines available</p>
                  </div>
                ) : (
                  headlines.map((article, index) => (
                    <motion.div
                      key={article._id}
                      className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-blue-500/50 hover:bg-slate-700/70 transition-all cursor-pointer group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleArticleClick(article)}
                    >
                      {/* Category Badge */}
                      {article.category && (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white mb-2 ${getCategoryColor(article.category)}`}>
                          {article.category.toUpperCase()}
                        </span>
                      )}

                      {/* Title */}
                      <h4 className="text-white font-medium text-sm mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                        {article.title}
                      </h4>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{article.source}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-900/50 border-t border-slate-700 text-center">
                <p className="text-slate-400 text-xs">
                  Auto-refreshes every 60 seconds
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </>
  );
};

export default QuickUpdates;
