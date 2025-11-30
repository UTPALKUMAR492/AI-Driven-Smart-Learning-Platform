import express from "express";
import { 
  getCourses, 
  getCourse, 
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getEnrolledCourses,
  updateProgress,
  addReview,
  getCategories,
  getFeaturedCourses,
  toggleWishlist,
  getWishlist
} from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin, isTeacherOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getCourses);
router.get("/categories", getCategories);
router.get("/featured", getFeaturedCourses);
router.get("/:id", getCourse);

// Teacher/Admin routes - Create course (teachers can create their own)
router.post("/", protect, isTeacherOrAdmin, createCourse);

// Update course - Teacher (own course) or Admin
router.put("/:id", protect, isTeacherOrAdmin, updateCourse);

// Delete course - Teacher (own course) or Admin
router.delete("/:id", protect, isTeacherOrAdmin, deleteCourse);

// Enrollment
router.post("/:id/enroll", protect, enrollCourse);
router.get("/user/enrolled", protect, getEnrolledCourses);
router.put("/:courseId/progress/:lessonId", protect, updateProgress);

// Reviews
router.post("/:id/review", protect, addReview);

// Wishlist
router.post("/:id/wishlist", protect, toggleWishlist);
router.get("/user/wishlist", protect, getWishlist);

export default router;
