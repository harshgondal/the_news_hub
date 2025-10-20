import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Article } from '../types';
import NewsCard from './NewsCard';
import LoadingSpinner from './LoadingSpinner';
import api from '../api/axios';
import ChatSidebar from './ChatSidebar';

const SavedArticles: React.FC = () => {
  const navigate = useNavigate();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchSavedArticles();
  }, []);

  const fetchSavedArticles = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📚 Fetching saved articles...');
      const response = await api.get('/user/saved-articles');
      console.log('📚 Saved articles response:', response.data);
      if (response.data.success) {
        setSavedArticles(response.data.data);
        console.log('📚 Saved articles count:', response.data.data.length);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load saved articles';
      setError(errorMsg);
      console.error('❌ Error fetching saved articles:', err);
      console.error('❌ Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (article: Article) => {
    setSelectedArticle(article);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedArticle(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading saved articles..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchSavedArticles}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (savedArticles.length === 0) {
    return (
      <div className="text-center py-16">
        <Bookmark className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Saved Articles
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Start saving articles to read them later
        </p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Browse Articles
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bookmark className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Saved Articles
          </h2>
          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
            {savedArticles.length}
          </span>
        </div>
        <button
          onClick={fetchSavedArticles}
          className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedArticles.map((article) => (
          <NewsCard 
            key={article._id} 
            article={article} 
            onChatClick={handleChatClick}
          />
        ))}
      </div>
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        article={selectedArticle}
      />
    </div>
  );
};

export default SavedArticles;
