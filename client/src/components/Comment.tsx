import { useState } from 'react';
import { ThumbsUp, Reply, Trash2, Edit2, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Comment as CommentType } from '../types';
import CommentInput from './CommentInput';

interface CommentProps {
  comment: CommentType;
  onReply: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  depth?: number;
}

const Comment: React.FC<CommentProps> = ({ 
  comment, 
  onReply, 
  onDelete, 
  onUpdate,
  onLike,
  depth = 0 
}) => {
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(
    user ? comment.likes.includes(user.id) : false
  );
  const [likesCount, setLikesCount] = useState(comment.likesCount);

  const isOwner = user?.id === comment.userId._id;
  const maxDepth = 3; // Maximum nesting level

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleReplySubmit = async (content: string) => {
    await onReply(comment._id, content);
    setShowReplyInput(false);
  };

  const handleEditSubmit = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      await onUpdate(comment._id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleLike = async () => {
    try {
      await onLike(comment._id);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-6'}`}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.userId.avatar || comment.userAvatar ? (
            <img
              src={comment.userId.avatar || comment.userAvatar}
              alt={comment.username}
              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200 dark:border-gray-600">
              {comment.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {comment.username}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                      (edited)
                    </span>
                  )}
                </div>
              </div>

              {/* Menu */}
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment._id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-2 ml-2">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center space-x-1 text-sm ${
                isLiked 
                  ? 'text-primary-600 dark:text-primary-400 font-semibold' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
              } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount > 0 ? likesCount : 'Like'}</span>
            </button>

            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                disabled={!user}
                className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Reply className="h-4 w-4" />
                <span>Reply</span>
              </button>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {showReplies ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span>
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && user && (
            <div className="mt-4">
              <CommentInput
                onSubmit={handleReplySubmit}
                placeholder={`Reply to ${comment.username}...`}
                autoFocus
                buttonText="Reply"
              />
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="space-y-4">
              {comment.replies.map((reply) => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  onReply={onReply}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onLike={onLike}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;
