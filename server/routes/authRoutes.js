import express from 'express';
import { signup, login, logout, getMe, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

// Public routes
router.post('/signup', upload.single('avatar'), signup); // Optional avatar upload
router.post('/login', login);
router.post('/google', googleAuth);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
