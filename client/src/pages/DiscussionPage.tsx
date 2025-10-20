import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ExternalLink, Calendar, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Article, Comment as CommentType } from '../types';
import Comment from '../components/Comment';
import CommentInput from '../components/CommentInput';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

const DiscussionPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [article, setArticle] = useState<Article | null>(location.state?.article || null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'top'>('latest');

  useEffect(() => {
    // If article not passed via state, fetch it
    if (!article && articleId) {
      fetchArticle();
    } else {
      setLoading(false);
    }
    
    if (articleId) {
      fetchComments();
    }
  }, [articleId, sortBy]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/news/${articleId}`);
      if (response.data.success) {
        setArticle(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load article');
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await api.get(`/comments/${articleId}`, {
        params: { sort: sortBy }
      });
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async (content: string) => {
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }

    try {
      const response = await api.post('/comments', {
        articleId,
        content
      });

      if (response.data.success) {
        // Add new comment to the top
        setComments([response.data.data, ...comments]);
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }

    try {
      const response = await api.post('/comments', {
        articleId,
        content,
        parentId
      });

      if (response.data.success) {
        // Refresh comments to show new reply
        fetchComments();
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await api.delete(`/comments/${commentId}`);
      // Remove comment from state
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err: any) {
      alert('Failed to delete comment');
      console.error('Error deleting comment:', err);
    }
  };

  const handleUpdate = async (commentId: string, content: string) => {
    try {
      const response = await api.put(`/comments/${commentId}`, { content });
      if (response.data.success) {
        // Update comment in state
        fetchComments();
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }

    try {
      await api.post(`/comments/${commentId}/like`);
    } catch (err: any) {
      console.error('Error liking comment:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading discussion..." />;
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Article not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Article Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Article Image */}
          <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/800x400?text=News+Article';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Source Badge */}
            <div className="absolute top-4 right-4">
              <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-semibold text-primary-600 dark:text-primary-400 shadow-lg">
                {article.source}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-6">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {article.title}
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {article.description}
            </p>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>Read Full Article</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Discussion
              </h2>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300">
                {comments.length}
              </span>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-1" />
                Latest
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'top'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Top
              </button>
            </div>
          </div>

          {/* Comment Input */}
          {user ? (
            <div className="mb-8">
              <CommentInput onSubmit={handlePostComment} />
            </div>
          ) : (
            <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Please login to join the discussion
              </p>
              <button
                onClick={() => navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Login to Comment
              </button>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onLike={handleLike}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionPage;
