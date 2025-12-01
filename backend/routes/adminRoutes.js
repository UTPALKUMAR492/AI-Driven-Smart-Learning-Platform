import express from "express";
import { 
  createCourse, 
  createQuiz,
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllCourses,
  toggleCoursePublish,
  toggleFeatured,
  getAllQuizzes,
  deleteQuiz
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, isAdmin);

// Dashboard
router.get("/stats", getDashboardStats);

// Users
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Courses
router.get("/courses", getAllCourses);
router.post("/course", createCourse);
router.put("/courses/:id/publish", toggleCoursePublish);
router.put("/courses/:id/featured", toggleFeatured);

// Quizzes
router.get("/quizzes", getAllQuizzes);
router.post("/quiz", createQuiz);
router.delete("/quizzes/:id", deleteQuiz);

export default router;
