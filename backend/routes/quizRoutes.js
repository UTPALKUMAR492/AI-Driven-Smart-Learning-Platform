import express from "express";
import { 
  getAllQuizzes, 
  getQuiz, 
  submitQuiz, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz,
  getTeacherQuizzes
} from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isTeacherOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllQuizzes);
router.get("/:id", getQuiz);

// Protected routes - submit quiz
router.post("/:id/submit", protect, submitQuiz);

// Teacher/Admin routes - CRUD
router.post("/", protect, isTeacherOrAdmin, createQuiz);
router.put("/:id", protect, isTeacherOrAdmin, updateQuiz);
router.delete("/:id", protect, isTeacherOrAdmin, deleteQuiz);

// Get teacher's own quizzes
router.get("/teacher/my-quizzes", protect, isTeacherOrAdmin, getTeacherQuizzes);

export default router;
