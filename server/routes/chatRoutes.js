import express from 'express';
import { analyzeArticle, askQuestion } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat - Analyze article (sentiment + summary + key points)
router.post('/', analyzeArticle);

// POST /api/chat/question - Ask follow-up question
router.post('/question', askQuestion);

export default router;
