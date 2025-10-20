import Comment from '../models/Comment.js';
import User from '../models/User.js';

// @desc    Get all comments for an article
// @route   GET /api/comments/:articleId
// @access  Public
export const getComments = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { sort = 'latest' } = req.query;

    // Build sort criteria
    let sortCriteria = {};
    if (sort === 'latest') {
      sortCriteria = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortCriteria = { createdAt: 1 };
    } else if (sort === 'top') {
      sortCriteria = { likesCount: -1, createdAt: -1 };
    }

    // Get top-level comments (no parent)
    const comments = await Comment.find({ 
      articleId, 
      parentId: null 
    })
      .sort(sortCriteria)
      .populate('userId', 'name avatar')
      .lean();

    // Get all replies for these comments
    const commentIds = comments.map(c => c._id);
    const replies = await Comment.find({ 
      parentId: { $in: commentIds } 
    })
      .sort({ createdAt: 1 })
      .populate('userId', 'name avatar')
      .lean();

    // Organize replies under their parent comments
    const commentsWithReplies = comments.map(comment => ({
      ...comment,
      replies: replies.filter(reply => 
        reply.parentId.toString() === comment._id.toString()
      )
    }));

    res.json({
      success: true,
      data: commentsWithReplies,
      count: comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
export const createComment = async (req, res) => {
  try {
    const { articleId, content, parentId } = req.body;
    const userId = req.user.id;

    // Validation
    if (!articleId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Article ID and content are required'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 2000 characters'
      });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If this is a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Increment replies count on parent
      await Comment.findByIdAndUpdate(parentId, {
        $inc: { repliesCount: 1 }
      });
    }

    // Create comment
    const comment = await Comment.create({
      articleId,
      userId,
      username: user.name,
      userAvatar: user.avatar || '',
      content: content.trim(),
      parentId: parentId || null
    });

    // Populate user info
    await comment.populate('userId', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      data: comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:commentId
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 2000 characters'
      });
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Update comment
    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('userId', 'name avatar');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // If this is a reply, decrement parent's reply count
    if (comment.parentId) {
      await Comment.findByIdAndUpdate(comment.parentId, {
        $inc: { repliesCount: -1 }
      });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentId: commentId });

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:commentId/like
// @access  Private
export const toggleLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already liked
    const likeIndex = comment.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Like
      comment.likes.push(userId);
      comment.likesCount += 1;
    }

    await comment.save();

    res.json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likesCount: comment.likesCount
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// @desc    Get comment count for an article
// @route   GET /api/comments/:articleId/count
// @access  Public
export const getCommentCount = async (req, res) => {
  try {
    const { articleId } = req.params;

    const count = await Comment.countDocuments({ articleId });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get comment count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comment count',
      error: error.message
    });
  }
};
