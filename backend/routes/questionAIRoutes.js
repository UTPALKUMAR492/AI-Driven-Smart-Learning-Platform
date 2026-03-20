import express from 'express';
import { generateQuestions } from '../controllers/questionAIController.js';
import { isTeacherOrAdmin, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/ai/generate-questions
router.post('/generate-questions', protect, isTeacherOrAdmin, generateQuestions);

export default router;
