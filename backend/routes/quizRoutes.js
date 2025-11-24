import express from "express";
import { getQuiz, submitQuiz, getResult } from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", getQuiz);
router.post("/:id/submit", protect, submitQuiz);
router.get("/result/:id", protect, getResult);

export default router;
