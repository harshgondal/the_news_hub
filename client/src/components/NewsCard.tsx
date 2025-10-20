import { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Sparkles, MessageSquare, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Article } from '../types';
import api from '../api/axios';

interface NewsCardProps {
  article: Article;
  onChatClick: (article: Article) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onChatClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);

  // Check if article is saved on mount
  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, article._id]);

  const checkIfSaved = async () => {
    try {
      const response = await api.get(`/user/is-saved/${article._id}`);
      if (response.data.success) {
        setIsSaved(response.data.data.isSaved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setSavingArticle(true);
    try {
      const response = await api.post(`/user/toggle-save/${article._id}`);
      if (response.data.success) {
        setIsSaved(response.data.data.isSaved);
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      alert(error.response?.data?.message || 'Failed to save article');
    } finally {
      setSavingArticle(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      business: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      technology: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      entertainment: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      health: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      science: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      politics: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      finance: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group border border-gray-200 dark:border-gray-700">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400x250?text=News+Article';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button
            onClick={handleToggleSave}
            disabled={savingArticle}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isSaved
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            title={isSaved ? 'Remove from saved' : 'Save article'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Source */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {article.source}
          </span>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(article.publishedAt)}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {article.description}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
                } else {
                  window.open(article.url, '_blank', 'noopener,noreferrer');
                }
              }}
              className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors"
            >
              Read Full Article
              <ExternalLink className="h-4 w-4 ml-1" />
            </button>
            
            <button
              onClick={() => {
                if (!user) {
                  navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}&action=chat&articleId=${article._id}`);
                } else {
                  onChatClick(article);
                }
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 font-medium text-sm transition-colors"
              title="AI Summary & Chat"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Chat</span>
            </button>
          </div>

          {/* Discussion Button */}
          <button
            onClick={() => {
              if (!user) {
                navigate(`/login?returnUrl=${encodeURIComponent(`/discussion/${article._id}`)}`);
              } else {
                navigate(`/discussion/${article._id}`, { state: { article } });
              }
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors border border-gray-200 dark:border-gray-600"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Join Discussion</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
