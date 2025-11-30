import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getResult, getUserQuizHistory } from "../controllers/quizController.js";
import User from "../models/User.js";
import Result from "../models/Result.js";
import Course from "../models/Course.js";

const router = express.Router();

// Get student stats (real data from database)
router.get("/stats", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user with enrolled courses
    const user = await User.findById(userId);
    
    // Get quiz results
    const results = await Result.find({ userId });
    
    // Calculate stats
    const quizzesCompleted = results.length;
    const averageScore = quizzesCompleted > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / quizzesCompleted)
      : 0;
    
    const coursesEnrolled = user.enrolledCourses?.length || 0;
    
    // Calculate completed courses
    const completedCourses = user.enrolledCourses?.filter(
      e => e.percentComplete === 100
    ).length || 0;
    
    // Calculate total learning hours (from course durations)
    let totalHours = 0;
    for (const enrollment of user.enrolledCourses || []) {
      const course = await Course.findById(enrollment.course);
      if (course) {
        totalHours += (course.totalDuration * enrollment.percentComplete / 100) / 60;
      }
    }
    
    // Score distribution
    const excellent = results.filter(r => r.percentage >= 90).length;
    const good = results.filter(r => r.percentage >= 70 && r.percentage < 90).length;
    const average = results.filter(r => r.percentage >= 50 && r.percentage < 70).length;
    const poor = results.filter(r => r.percentage < 50).length;

    res.json({
      quizzesCompleted,
      averageScore,
      coursesEnrolled,
      completedCourses,
      hoursSpent: Math.round(totalHours),
      streak: user.streak || 0,
      scoreDistribution: [
        { name: "Excellent (90%+)", value: excellent },
        { name: "Good (70-89%)", value: good },
        { name: "Average (50-69%)", value: average },
        { name: "Needs Work (<50%)", value: poor }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch stats", error: err.message });
  }
});

// Get recent activity
router.get("/recent", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recent quiz results
    const recentQuizzes = await Result.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("quizId", "title");
    
    // Get recently enrolled courses
    const user = await User.findById(userId)
      .populate("enrolledCourses.course", "title thumbnail");
    
    const recentEnrollments = user.enrolledCourses
      ?.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
      .slice(0, 5) || [];
    
    // Combine and format
    const activities = [];
    
    recentQuizzes.forEach(q => {
      activities.push({
        type: "quiz",
        title: q.quizId?.title || "Quiz",
        subtitle: `Score: ${q.percentage}%`,
        time: formatTimeAgo(q.createdAt),
        timestamp: q.createdAt
      });
    });
    
    recentEnrollments.forEach(e => {
      activities.push({
        type: "course",
        title: e.course?.title || "Course",
        subtitle: `Progress: ${e.percentComplete}%`,
        time: formatTimeAgo(e.enrolledAt),
        timestamp: e.enrolledAt
      });
    });
    
    // Sort by time and return top 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activities.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: "Could not fetch activity", error: err.message });
  }
});

// Get personalized recommendations
router.get("/recommendations", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // Get enrolled course IDs
    const enrolledIds = user.enrolledCourses?.map(e => e.course.toString()) || [];
    
    // Find courses not enrolled, prioritize by rating and enrollment
    const recommendations = await Course.find({
      _id: { $nin: enrolledIds },
      isPublished: true
    })
      .sort({ rating: -1, studentsEnrolled: -1 })
      .limit(6)
      .select("title description thumbnail rating studentsEnrolled category level");

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch recommendations", error: err.message });
  }
});

// Get learning progress overview
router.get("/progress", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .populate({
        path: "enrolledCourses.course",
        select: "title thumbnail totalLessons totalDuration category"
      });

    const progressData = user.enrolledCourses?.map(e => ({
      courseId: e.course?._id,
      title: e.course?.title,
      thumbnail: e.course?.thumbnail,
      category: e.course?.category,
      progress: e.percentComplete,
      completedLessons: e.completedLessons,
      totalLessons: e.totalLessons,
      lastAccessed: e.lastAccessedAt
    })) || [];

    res.json(progressData);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch progress", error: err.message });
  }
});

// Results endpoint
router.get("/results/:id", protect, getResult);
router.get("/quiz-history", protect, getUserQuizHistory);

// Get enrolled courses
router.get("/enrolled-courses", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .populate({
        path: "enrolledCourses.course",
        select: "title description thumbnail instructor lessons totalDuration category level rating",
        populate: {
          path: "instructor",
          select: "username avatar"
        }
      });

    const enrolledCourses = user.enrolledCourses?.map(e => ({
      _id: e.course?._id,
      title: e.course?.title,
      description: e.course?.description,
      thumbnail: e.course?.thumbnail,
      instructor: e.course?.instructor,
      lessons: e.course?.lessons,
      totalDuration: e.course?.totalDuration,
      category: e.course?.category,
      level: e.course?.level,
      rating: e.course?.rating,
      progress: e.percentComplete || 0,
      lessonsCompleted: e.completedLessons?.length || 0,
      enrolledAt: e.enrolledAt,
      lastAccessedAt: e.lastAccessedAt
    })).filter(c => c._id) || [];

    res.json(enrolledCourses);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch enrolled courses", error: err.message });
  }
});

// Get wishlist
router.get("/wishlist", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .populate({
        path: "wishlist",
        select: "title description thumbnail instructor price rating category level",
        populate: {
          path: "instructor",
          select: "username avatar"
        }
      });

    res.json(user.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch wishlist", error: err.message });
  }
});

// Helper function to format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default router;
