import { useState, useEffect } from 'react';
import api from '../api/axios';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CategoryFilter from '../components/CategoryFilter';
import ChatSidebar from '../components/ChatSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Article, Pagination, ApiResponse } from '../types';

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const fetchNews = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '/news';
      const params = { page, limit: 12 };
      
      if (selectedCategory !== 'all') {
        endpoint = `/news/category/${selectedCategory}`;
      }
      
      const response = await api.get<ApiResponse<Article[]>>(endpoint, { params });
      
      if (response.data.success) {
        setArticles(response.data.data);
        setPagination(response.data.pagination || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch news. Please try again.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, page]);

  const handleCategoryChange = (category: string): void => {
    setSelectedCategory(category);
    setPage(1); // Reset to first page when category changes
  };

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChatClick = (article: Article): void => {
    setSelectedArticle(article);
    setIsChatOpen(true);
  };

  const handleCloseChat = (): void => {
    setIsChatOpen(false);
    // Don't clear selectedArticle immediately to allow smooth close animation
    setTimeout(() => setSelectedArticle(null), 300);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Latest News
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with the latest news from top Indian newspapers
          </p>
        </div>

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Fetching latest news..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchNews} />
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No articles found. Try a different category or check back later.
            </p>
          </div>
        ) : (
          <>
            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articles.map((article) => (
                <NewsCard 
                  key={article._id} 
                  article={article}
                  onChatClick={handleChatClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </button>
                
                <span className="text-gray-700 dark:text-gray-300">
                  Page {page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        article={selectedArticle}
      />
    </div>
  );
};

export default Home;
