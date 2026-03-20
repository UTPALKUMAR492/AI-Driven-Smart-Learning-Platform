import express from 'express';
import { getQuestionsByCourse, getRecentQuestions } from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isTeacherOrAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Only teachers/admins can fetch question bank for a course
router.get('/course/:courseId', protect, isTeacherOrAdmin, getQuestionsByCourse);
// Get recent questions (global) - teacher/admin only
router.get('/recent', protect, isTeacherOrAdmin, getRecentQuestions);

// Publish a generated question (mark published=true)
router.post('/:id/publish', protect, isTeacherOrAdmin, async (req, res, next) => {
	// forwarded to controller
	try {
		const { publishQuestion } = await import('../controllers/questionController.js');
		return publishQuestion(req, res, next);
	} catch (err) { next(err) }
});

// Delete a question
router.delete('/:id', protect, isTeacherOrAdmin, async (req, res, next) => {
	try {
		const { deleteQuestion } = await import('../controllers/questionController.js');
		return deleteQuestion(req, res, next);
	} catch (err) { next(err) }
});

export default router;
