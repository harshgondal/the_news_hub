import User from '../models/User.js';
import Article from '../models/Article.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Save/Bookmark an article
// @route   POST /api/user/save-article/:articleId
// @access  Private
export const saveArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    // Check if article exists
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if article is already saved
    if (user.savedArticles.includes(articleId)) {
      return res.status(400).json({
        success: false,
        message: 'Article already saved'
      });
    }

    // Add article to saved articles
    user.savedArticles.push(articleId);
    await user.save();

    res.json({
      success: true,
      message: 'Article saved successfully',
      data: {
        savedArticles: user.savedArticles
      }
    });
  } catch (error) {
    console.error('Save article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving article',
      error: error.message
    });
  }
};

// @desc    Unsave/Remove bookmark from an article
// @route   DELETE /api/user/save-article/:articleId
// @access  Private
export const unsaveArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if article is saved
    if (!user.savedArticles.includes(articleId)) {
      return res.status(400).json({
        success: false,
        message: 'Article not saved'
      });
    }

    // Remove article from saved articles
    user.savedArticles = user.savedArticles.filter(
      id => id.toString() !== articleId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Article removed from saved',
      data: {
        savedArticles: user.savedArticles
      }
    });
  } catch (error) {
    console.error('Unsave article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing saved article',
      error: error.message
    });
  }
};

// @desc    Toggle save/unsave article
// @route   POST /api/user/toggle-save/:articleId
// @access  Private
export const toggleSaveArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    // Check if article exists
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let isSaved = false;
    let message = '';

    // Check if article is already saved
    if (user.savedArticles.includes(articleId)) {
      // Unsave
      user.savedArticles = user.savedArticles.filter(
        id => id.toString() !== articleId
      );
      message = 'Article removed from saved';
      isSaved = false;
    } else {
      // Save
      user.savedArticles.push(articleId);
      message = 'Article saved successfully';
      isSaved = true;
    }

    await user.save();

    res.json({
      success: true,
      message,
      data: {
        isSaved,
        savedArticles: user.savedArticles
      }
    });
  } catch (error) {
    console.error('Toggle save article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling saved article',
      error: error.message
    });
  }
};

// @desc    Get all saved articles for a user
// @route   GET /api/user/saved-articles
// @access  Private
export const getSavedArticles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;

    // Find user and populate saved articles
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get saved article IDs
    const savedArticleIds = user.savedArticles;

    // Fetch articles with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const articles = await Article.find({
      _id: { $in: savedArticleIds }
    })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = savedArticleIds.length;
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: articles,
      pagination: {
        total,
        page: parseInt(page),
        pages,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get saved articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved articles',
      error: error.message
    });
  }
};

// @desc    Check if article is saved by user
// @route   GET /api/user/is-saved/:articleId
// @access  Private
export const isArticleSaved = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isSaved = user.savedArticles.includes(articleId);

    res.json({
      success: true,
      data: { isSaved }
    });
  } catch (error) {
    console.error('Check saved article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking saved article',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PATCH /api/user/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar; // Allow empty string to remove avatar

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          provider: user.provider
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Update profile picture
// @route   PATCH /api/user/profile-picture
// @access  Private
export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile picture',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          provider: user.provider,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Upload profile picture (file upload)
// @route   POST /api/user/upload-avatar
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old avatar file if it exists and is not a URL
    if (user.avatar && !user.avatar.startsWith('http')) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Save new avatar path (relative to server root)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        avatar: avatarUrl
      }
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
};
