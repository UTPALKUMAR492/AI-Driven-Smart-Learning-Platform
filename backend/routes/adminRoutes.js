import express from "express";
import { createCourse, createQuiz } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/course", protect, isAdmin, createCourse);
router.post("/quiz", protect, isAdmin, createQuiz);

export default router;
