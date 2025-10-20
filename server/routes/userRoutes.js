import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../config/multer.js';
import {
  saveArticle,
  unsaveArticle,
  toggleSaveArticle,
  getSavedArticles,
  isArticleSaved,
  updateProfile,
  updateProfilePicture as updateProfilePictureUrl,
  getUserProfile,
  uploadProfilePicture
} from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getUserProfile);
router.patch('/profile', updateProfile);
router.patch('/profile-picture', updateProfilePictureUrl); // URL-based update
router.post('/upload-avatar', upload.single('avatar'), uploadProfilePicture); // File upload

// Save/Unsave routes
router.post('/save-article/:articleId', saveArticle);
router.delete('/save-article/:articleId', unsaveArticle);
router.post('/toggle-save/:articleId', toggleSaveArticle);

// Get saved articles
router.get('/saved-articles', getSavedArticles);

// Check if article is saved
router.get('/is-saved/:articleId', isArticleSaved);

export default router;
