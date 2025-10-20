import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  buttonText?: string;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  placeholder = "Share your thoughts...",
  autoFocus = false,
  buttonText = "Post Comment"
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > 2000) {
      setError('Comment cannot exceed 2000 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start space-x-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200 dark:border-gray-600">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={3}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-colors"
          />
          
          {/* Character Count */}
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${content.length > 1900 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {content.length}/2000
            </span>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {buttonText}
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </form>
  );
};

export default CommentInput;
