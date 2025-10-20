import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  getCommentCount
} from '../controllers/commentController.js';

const router = express.Router();

// Public routes
router.get('/:articleId', getComments);
router.get('/:articleId/count', getCommentCount);

// Protected routes (require authentication)
router.post('/', protect, createComment);
router.put('/:commentId', protect, updateComment);
router.delete('/:commentId', protect, deleteComment);
router.post('/:commentId/like', protect, toggleLike);

export default router;
