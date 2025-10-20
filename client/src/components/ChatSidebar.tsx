import { useState, useEffect } from 'react';
import { X, Copy, Share2, Loader2, MessageSquare, Sparkles, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import api from '../api/axios';
import { Article, Analysis, QA, ApiResponse } from '../types';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose, article }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [askingQuestion, setAskingQuestion] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<QA[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Reset state when sidebar closes or article changes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when sidebar closes
      setAnalysis(null);
      setError(null);
      setQaHistory([]);
      setCustomQuestion('');
      setCopied(false);
    }
  }, [isOpen]);

  // Reset state when article changes
  useEffect(() => {
    setAnalysis(null);
    setError(null);
    setQaHistory([]);
    setCustomQuestion('');
    setCopied(false);
  }, [article?._id]);

  // Fetch analysis when sidebar opens
  const fetchAnalysis = async (): Promise<void> => {
    if (!article || analysis) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post<ApiResponse<Analysis>>('/chat', {
        title: article.title,
        description: article.description,
        content: article.content || article.description
      });

      if (response.data.success) {
        setAnalysis(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze article');
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ask custom question
  const handleAskQuestion = async (question: string, type: string | null = null): Promise<void> => {
    if (!question.trim() && !type) return;

    try {
      setAskingQuestion(true);
      
      const response = await api.post<ApiResponse<{ answer: string }>>('/chat/question', {
        title: article?.title,
        content: article?.content || article?.description,
        description: article?.description,
        question: question,
        type: type
      });

      if (response.data.success) {
        setQaHistory([...qaHistory, {
          question: question,
          answer: response.data.data.answer,
          timestamp: new Date()
        }]);
        setCustomQuestion('');
      }
    } catch (err) {
      console.error('Error asking question:', err);
    } finally {
      setAskingQuestion(false);
    }
  };

  // Copy summary to clipboard
  const handleCopy = (): void => {
    if (analysis?.summary) {
      navigator.clipboard.writeText(analysis.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share summary
  const handleShare = (): void => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && analysis?.summary && article) {
      navigator.share({
        title: article.title,
        text: analysis.summary,
        url: article.url
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get sentiment icon
  const getSentimentIcon = (sentiment: string): JSX.Element => {
    switch (sentiment) {
      case 'Positive':
        return <ThumbsUp className="h-4 w-4" />;
      case 'Negative':
        return <ThumbsDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  // Trigger analysis when sidebar opens
  if (isOpen && !loading && !analysis && !error) {
    fetchAnalysis();
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                AI Analysis
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Article Title */}
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                {article?.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {article?.source}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Analyzing article...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                <button
                  onClick={fetchAnalysis}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <>
                {/* Sentiment */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Sentiment Analysis
                  </h4>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-semibold ${getSentimentColor(analysis.sentiment)}`}>
                    {getSentimentIcon(analysis.sentiment)}
                    <span>{analysis.sentiment}</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      AI Summary
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Copy summary"
                      >
                        <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <button
                          onClick={handleShare}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Share summary"
                        >
                          <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {analysis.summary}
                  </p>
                  {copied && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ Copied to clipboard
                    </p>
                  )}
                </div>

                {/* Key Points */}
                {analysis.keyPoints && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Key Points
                    </h4>
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {analysis.keyPoints}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Quick Actions
                  </h4>
                  <button
                    onClick={() => handleAskQuestion('Explain in simple words', 'simple')}
                    disabled={askingQuestion}
                    className="w-full text-left px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm"
                  >
                    💡 Explain in simple words
                  </button>
                </div>

                {/* Q&A History */}
                {qaHistory.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Q&A History
                    </h4>
                    {qaHistory.map((qa, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Q: {qa.question}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          A: {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Question Input */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Ask a Question
                  </h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion(customQuestion)}
                      placeholder="Ask about the article or any topic..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={askingQuestion}
                    />
                    <button
                      onClick={() => handleAskQuestion(customQuestion)}
                      disabled={askingQuestion || !customQuestion.trim()}
                      className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {askingQuestion ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Powered by Google Gemini AI
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
