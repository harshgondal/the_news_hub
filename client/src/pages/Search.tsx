import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ChatSidebar from '../components/ChatSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Article, Pagination, ApiResponse } from '../types';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<string>('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Auto-search from URL query parameter
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      performSearch(urlQuery, 1);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, newPage: number = 1): Promise<void> => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const response = await api.get<ApiResponse<Article[]>>('/news/search', {
        params: { q: searchQuery, page: newPage, limit: 12 }
      });
      
      if (response.data.success) {
        setArticles(response.data.data);
        setPagination(response.data.pagination || null);
        setPage(newPage);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search news. Please try again.');
      console.error('Error searching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number): void => {
    performSearch(query, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChatClick = (article: Article): void => {
    setSelectedArticle(article);
    setIsChatOpen(true);
  };

  const handleCloseChat = (): void => {
    setIsChatOpen(false);
    setTimeout(() => setSelectedArticle(null), 300);
  };

  const suggestedSearches: string[] = [
    'politics',
    'finance',
    'sports',
    'technology',
    'health',
    'education',
    'cricket',
    'economy'
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Search News
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search for specific topics, keywords, or events
          </p>
        </div>

        {/* Search info */}
        {hasSearched && query && (
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <p className="text-primary-700 dark:text-primary-300">
              <span className="font-semibold">Searching for:</span> "{query}"
              {/* <span className="text-sm ml-2">(Use the search bar in the navbar to search again)</span> */}
            </p>
          </div>
        )}

        {/* Suggested Searches */}
        {!hasSearched && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Suggested Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestedSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    performSearch(term, 1);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Searching for articles..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => performSearch(query, page)} />
        ) : hasSearched ? (
          articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No articles found for "{query}". Try different keywords.
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Found <span className="font-semibold">{pagination?.total || 0}</span> articles for "{query}"
                </p>
              </div>

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
          )
        ) : null}
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

export default Search;
