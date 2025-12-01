import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import Result from "../models/Result.js";

// Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalQuizzes,
      totalStudents,
      totalTeachers,
      recentUsers,
      topCourses,
      revenueData
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Quiz.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt avatar"),
      Course.find().sort({ studentsEnrolled: -1 }).limit(5).select("title studentsEnrolled rating thumbnail"),
      Course.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: { $multiply: ["$price", "$studentsEnrolled"] } } } }
      ])
    ]);

    // Monthly enrollment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyEnrollments = await User.aggregate([
      { $unwind: "$enrolledCourses" },
      { $match: { "enrolledCourses.enrolledAt": { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: "$enrolledCourses.enrolledAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalCourses,
        totalQuizzes,
        totalStudents,
        totalTeachers,
        totalRevenue: revenueData[0]?.totalRevenue || 0
      },
      recentUsers,
      topCourses,
      monthlyEnrollments
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch stats", error: err.message });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch users", error: err.message });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Could not update user", error: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete user", error: err.message });
  }
};

// Get all courses for admin
export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructor", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(query)
    ]);

    res.json({
      courses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch courses", error: err.message });
  }
};

// Create course
export const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user._id,
      instructorName: req.user.name
    };
    
    const course = await Course.create(courseData);
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: "Could not create course", error: err.message });
  }
};

// Toggle course publish status
export const toggleCoursePublish = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.isPublished = !course.isPublished;
    await course.save();

    res.json({ isPublished: course.isPublished });
  } catch (err) {
    res.status(500).json({ message: "Could not update course", error: err.message });
  }
};

// Toggle featured status
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.isFeatured = !course.isFeatured;
    await course.save();

    res.json({ isFeatured: course.isFeatured });
  } catch (err) {
    res.status(500).json({ message: "Could not update course", error: err.message });
  }
};

// Get all quizzes for admin
export const getAllQuizzes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [quizzes, total] = await Promise.all([
      Quiz.find()
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Quiz.countDocuments()
    ]);

    res.json({
      quizzes,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch quizzes", error: err.message });
  }
};

// Create quiz
export const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Could not create quiz", error: err.message });
  }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Quiz.findByIdAndDelete(id);
    await Result.deleteMany({ quizId: id });

    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete quiz", error: err.message });
  }
};
