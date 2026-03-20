import express from 'express';
import { generateQuiz, recommendations } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// generate an adaptive quiz for user
router.post('/generate-quiz', protect, generateQuiz);

// get simple recommendations for current user
router.get('/recommendations', protect, recommendations);

export default router;
