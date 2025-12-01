import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isTeacherOrAdmin } from "../middleware/roleMiddleware.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import Result from "../models/Result.js";

const router = express.Router();

// All routes require authentication and teacher/admin role
router.use(protect, isTeacherOrAdmin);

// Get teacher dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    // Get teacher's courses
    const courses = await Course.find({ instructor: teacherId });
    const courseIds = courses.map(c => c._id);
    
    // Get quizzes created by teacher
    const quizzes = await Quiz.find({ createdBy: teacherId });
    const quizIds = quizzes.map(q => q._id);
    
    // Calculate total students
    const totalStudents = courses.reduce((sum, c) => sum + (c.studentsEnrolled || 0), 0);
    
    // Calculate total revenue
    const totalRevenue = courses.reduce((sum, c) => {
      const price = c.price?.amount || 0;
      const discount = c.price?.discount || 0;
      const effectivePrice = price * (1 - discount / 100);
      return sum + (effectivePrice * (c.studentsEnrolled || 0));
    }, 0);
    
    // Get quiz attempts
    const quizAttempts = await Result.countDocuments({ quizId: { $in: quizIds } });
    
    // Get average course rating
    const totalRating = courses.reduce((sum, c) => sum + (c.rating || 0), 0);
    const avgRating = courses.length > 0 ? (totalRating / courses.length).toFixed(1) : 0;
    
    res.json({
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.isPublished).length,
      totalQuizzes: quizzes.length,
      totalStudents,
      totalRevenue: Math.round(totalRevenue),
      quizAttempts,
      averageRating: avgRating
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch stats", error: err.message });
  }
});

// Get teacher's courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch courses", error: err.message });
  }
});

// Get teacher's quizzes
router.get("/quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch quizzes", error: err.message });
  }
});

// Get students enrolled in teacher's courses
router.get("/students", async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    const courseIds = courses.map(c => c._id);
    
    // Find users enrolled in these courses
    const students = await User.find({
      'enrolledCourses.course': { $in: courseIds }
    }).select('name email avatar enrolledCourses createdAt');
    
    // Map students with their enrollment details
    const studentData = students.map(student => {
      const enrollments = student.enrolledCourses.filter(
        e => courseIds.some(cId => cId.toString() === e.course.toString())
      );
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        enrolledCourses: enrollments.length,
        joinedAt: student.createdAt
      };
    });
    
    res.json(studentData);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch students", error: err.message });
  }
});

// Publish/Unpublish course
router.put("/courses/:id/publish", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check ownership
    if (course.instructor?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    course.isPublished = !course.isPublished;
    await course.save();
    
    res.json({ 
      message: course.isPublished ? "Course published" : "Course unpublished",
      isPublished: course.isPublished 
    });
  } catch (err) {
    res.status(500).json({ message: "Could not update course", error: err.message });
  }
});

// Publish/Unpublish quiz
router.put("/quizzes/:id/publish", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // Check ownership
    if (quiz.createdBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    quiz.isPublished = !quiz.isPublished;
    await quiz.save();
    
    res.json({ 
      message: quiz.isPublished ? "Quiz published" : "Quiz unpublished",
      isPublished: quiz.isPublished 
    });
  } catch (err) {
    res.status(500).json({ message: "Could not update quiz", error: err.message });
  }
});

// Get course analytics
router.get("/courses/:id/analytics", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check ownership
    if (course.instructor?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Get enrolled students with progress
    const enrolledUsers = await User.find({
      'enrolledCourses.course': req.params.id
    }).select('name email enrolledCourses');
    
    const studentProgress = enrolledUsers.map(user => {
      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === req.params.id
      );
      return {
        name: user.name,
        email: user.email,
        progress: enrollment?.percentComplete || 0,
        enrolledAt: enrollment?.enrolledAt
      };
    });
    
    res.json({
      totalEnrolled: course.studentsEnrolled || 0,
      rating: course.rating || 0,
      totalReviews: course.reviews?.length || 0,
      students: studentProgress
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch analytics", error: err.message });
  }
});

export default router;
