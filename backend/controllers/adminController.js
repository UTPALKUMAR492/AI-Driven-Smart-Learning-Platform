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

    // total enrollments across courses
    const enrollAgg = await Course.aggregate([
      { $group: { _id: null, totalEnrollments: { $sum: { $ifNull: ["$studentsEnrolled", 0] } } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalCourses,
        totalQuizzes,
        totalStudents,
        totalTeachers,
        totalEnrollments: enrollAgg[0]?.totalEnrollments || 0,
        revenue: revenueData[0]?.totalRevenue || 0
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
    const { page = 1, limit = 10, search, isPublished } = req.query;
    
    let query = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (isPublished !== undefined) {
      // accept 'true'/'false' or boolean
      query.isPublished = (isPublished === 'true' || isPublished === true);
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
    console.log('createCourse incoming request - user:', req.user?._id || 'no-user', 'authHeaderPresent:', !!req.headers.authorization)
    console.log('createCourse payload summary:', {
      title: req.body.title,
      descriptionExists: !!req.body.description,
      thumbnailType: typeof req.body.thumbnail,
      lessonsCount: Array.isArray(req.body.lessons) ? req.body.lessons.length : 0,
      firstLessonPreview: req.body.lessons && req.body.lessons[0] ? (req.body.lessons[0].videoUrl || req.body.lessons[0].content || '').slice(0,200) : undefined
    })
    // Build course payload with backwards compatibility for `lessons`
    let thumbnail = req.body.thumbnail || '';

    const amount = typeof req.body.price === 'number'
      ? req.body.price
      : (req.body.price && typeof req.body.price === 'object')
        ? (req.body.price.amount || 0)
        : (req.body.price?.amount || 0);

    const courseData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      level: req.body.level,
      language: req.body.language,
      price: amount,
      originalPrice: req.body.originalPrice || amount,
      isFree: amount === 0,
      thumbnail: thumbnail,
      instructor: req.user._id,
      instructorName: req.user.name,
      instructorAvatar: req.user.avatar || '',
      requirements: req.body.requirements || [],
      whatYouWillLearn: req.body.whatYouWillLearn || [],
      totalLessons: req.body.lessons?.length || 0,
      totalDuration: req.body.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0),
      isPublished: req.body.isPublished !== undefined ? !!req.body.isPublished : true
    };

    if (req.body.lessons && Array.isArray(req.body.lessons)) {
      // Normalize video URLs and strip iframe HTML if admin pasted full iframe markup
      const normalizeVideo = (raw) => {
        if (!raw) return ''
        // If raw contains an iframe tag, extract the src attribute
        try {
          const lowered = String(raw)
          if (lowered.includes('<iframe')) {
            const m = raw.match(/src=["']([^"']+)["']/i)
            if (m && m[1]) return m[1]
          }
          // If it's an HTML snippet containing <a href=>, extract href
          if (lowered.includes('<a')) {
            const m = raw.match(/href=["']([^"']+)["']/i)
            if (m && m[1]) return m[1]
          }
          // Trim whitespace
          raw = String(raw).trim()
          // If it's a YouTube watch or short link, convert to embed/watch link as-is
          // We'll store whatever URL is provided; frontend player handles embed/watch variations
          return raw
        } catch (e) {
          return String(raw)
        }
      }

      // create simple sections structure
      courseData.sections = [
        {
          title: 'Course Content',
          order: 1,
          lessons: req.body.lessons.map((l, idx) => ({
            title: l.title || l.name || `Lesson ${idx + 1}`,
            content: normalizeVideo(l.videoUrl || l.content || ''),
            type: 'video',
            duration: l.duration || 0,
            order: idx + 1,
            isPreview: l.isFree || false
          }))
        }
      ];

      courseData.lessons = req.body.lessons.map(l => ({
        title: l.title || l.name || 'Lesson',
        description: l.description || '',
        videoUrl: normalizeVideo(l.videoUrl || l.content || ''),
        duration: l.duration || 0,
        isFree: l.isFree || false,
        notes: l.notes || ''
      }));
    }

    const course = await Course.create(courseData);
    await User.findByIdAndUpdate(req.user._id, { $push: { teachingCourses: course._id } });
    res.status(201).json(course);
  } catch (err) {
    console.error('createCourse error', err);
    res.status(500).json({ message: "Could not create course", error: err?.message || String(err) });
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

    // Notify instructor when course is published
    try {
      await course.populate('instructor', 'email name');
      const instructor = course.instructor;
      if (instructor) {
        // Add notification to user
        await User.findByIdAndUpdate(instructor._id, {
          $push: {
            notifications: {
              type: 'course_published',
              message: `Your course "${course.title}" was ${course.isPublished ? 'published' : 'unpublished'} by admin`,
              data: { courseId: course._id },
              createdAt: new Date()
            }
          }
        });

        // Send email if SMTP configured (nodemailer optional)
        try {
          if (process.env.SMTP_HOST) {
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT || 587,
              secure: (process.env.SMTP_SECURE || 'false') === 'true',
              auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
            });
            await transporter.sendMail({
              from: process.env.EMAIL_FROM || 'no-reply@smartlearning.local',
              to: instructor.email,
              subject: `Your course "${course.title}" status updated`,
              text: `Hello ${instructor.name || ''},\n\nYour course \"${course.title}\" was ${course.isPublished ? 'published' : 'unpublished'} by the admin.\n\nThanks,\nSmartLearning Team`
            });
          } else {
            console.log('SMTP not configured: skipping email notification');
          }
        } catch (emailErr) {
          console.warn('Email send failed', emailErr.message);
        }
      }
    } catch (notifyErr) {
      console.warn('Notify instructor failed', notifyErr.message);
    }

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

// Get quiz results for admin (ranked)
export const getQuizResults = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const results = await Result.find({ quizId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ percentage: -1, score: -1, completedAt: 1 });

    const mapped = results.map((r, idx) => ({
      _id: r._id,
      user: r.userId,
      score: r.score,
      total: r.total,
      percentage: r.percentage,
      completedAt: r.completedAt,
      rank: idx + 1
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch quiz results', error: err.message });
  }
}

// Create quiz
export const createQuiz = async (req, res) => {
  try {
    // Ensure createdBy is set from the authenticated admin user
    const payload = {
      ...req.body,
      createdBy: req.user?._id
    };

    // Basic validation: ensure title and questions structure
    if (!payload.title) return res.status(400).json({ message: 'Quiz title is required' });
    if (!Array.isArray(payload.questions) || payload.questions.length === 0) return res.status(400).json({ message: 'Quiz must contain at least one question' });

    const quiz = await Quiz.create(payload);
    res.status(201).json(quiz);
  } catch (err) {
    console.error('createQuiz error', err);
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
