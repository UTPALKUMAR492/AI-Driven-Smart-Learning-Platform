import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isTeacherOrAdmin } from "../middleware/roleMiddleware.js";

import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import Result from "../models/Result.js";

const router = express.Router();

// Apply auth + role
router.use(protect, isTeacherOrAdmin);

/* ---------------------------------------------------
   📌 1. TEACHER DASHBOARD STATS
-----------------------------------------------------*/
router.get("/stats", async (req, res) => {
  try {
    const teacherId = req.user._id;

    const courses = await Course.find({ instructor: teacherId });
    const quizzes = await Quiz.find({ createdBy: teacherId });

    const quizIds = quizzes.map(q => q._id);

    const totalStudents = courses.reduce((sum, c) => sum + (c.studentsEnrolled || 0), 0);

    const totalRevenue = courses.reduce((sum, c) => {
      const price = c.price || 0;
      return sum + (price * (c.studentsEnrolled || 0));
    }, 0);

    const quizAttempts = await Result.countDocuments({ quizId: { $in: quizIds } });

    const totalRating = courses.reduce((sum, c) => sum + (c.rating || 0), 0);
    const avgRating = courses.length ? (totalRating / courses.length).toFixed(1) : 0;

    res.json({
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.isPublished).length,
      totalQuizzes: quizzes.length,
      totalStudents,
      totalRevenue,
      quizAttempts,
      averageRating: avgRating
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch stats", error: err.message });
  }
});


/* ---------------------------------------------------
   📌 2. GET TEACHER COURSES
-----------------------------------------------------*/
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });

    // Ensure lesson counts are accurate for frontend display (fallback to sections/lessons length)
    const mapped = courses.map(c => {
      let lessonsCount = c.totalLessons || 0;
      if (!lessonsCount) {
        if (Array.isArray(c.lessons) && c.lessons.length) lessonsCount = c.lessons.length;
        else if (Array.isArray(c.sections) && c.sections.length) {
          lessonsCount = c.sections.reduce((sum, s) => sum + ((s.lessons && s.lessons.length) || 0), 0);
        }
      }
      return {
        ...c.toObject(),
        totalLessons: lessonsCount
      };
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch courses", error: err.message });
  }
});


/* ---------------------------------------------------
   📌 3. CREATE COURSE (WORKS WITH FRONTEND)
-----------------------------------------------------*/
router.post("/courses", async (req, res) => {
  try {
    // Normalize incoming payload and map lessons -> sections + legacy lessons
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
      thumbnail: req.body.thumbnail || '',
      instructor: req.user._id,
      instructorName: req.user.name,
      instructorAvatar: req.user.avatar || '',
      requirements: req.body.requirements || [],
      whatYouWillLearn: req.body.whatYouWillLearn || [],
      totalLessons: req.body.lessons?.length || 0,
      totalDuration: req.body.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0),
      isPublished: req.body.isPublished !== undefined ? !!req.body.isPublished : false
    };

    if (req.body.lessons && Array.isArray(req.body.lessons)) {
      courseData.sections = [
        {
          title: 'Course Content',
          order: 1,
          lessons: req.body.lessons.map((l, idx) => ({
            title: l.title || l.name || `Lesson ${idx + 1}`,
            content: l.videoUrl || l.content || '',
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
        videoUrl: l.videoUrl || l.content || '',
        duration: l.duration || 0,
        isFree: l.isFree || false,
        notes: l.notes || ''
      }));
    }

    const course = await Course.create(courseData);

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (err) {
    res.status(400).json({ message: 'Failed to create course', error: err.message });
  }
});


/* ---------------------------------------------------
   📌 4. UPDATE COURSE
-----------------------------------------------------*/
router.put("/courses/:id", async (req, res) => {
  try {
    // Normalize lessons into sections + legacy lessons when updating
    const updateData = { ...req.body };
    if (req.body.lessons && Array.isArray(req.body.lessons)) {
      updateData.sections = [
        {
          title: 'Course Content',
          order: 1,
          lessons: req.body.lessons.map((l, idx) => ({
            title: l.title || l.name || `Lesson ${idx + 1}`,
            content: l.videoUrl || l.content || '',
            type: 'video',
            duration: l.duration || 0,
            order: idx + 1,
            isPreview: l.isFree || false
          }))
        }
      ];
      updateData.lessons = req.body.lessons.map(l => ({
        title: l.title || l.name || 'Lesson',
        description: l.description || '',
        videoUrl: l.videoUrl || l.content || '',
        duration: l.duration || 0,
        isFree: l.isFree || false,
        notes: l.notes || ''
      }));
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json({ message: "Course updated", course });
  } catch (err) {
    res.status(400).json({ message: "Could not update course", error: err.message });
  }
});


/* ---------------------------------------------------
   📌 5. DELETE COURSE
-----------------------------------------------------*/
router.delete("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await course.deleteOne();

    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete course", error: err.message });
  }
});


/* ---------------------------------------------------
   📌 6. PUBLISH / UNPUBLISH COURSE
-----------------------------------------------------*/
router.put("/courses/:id/publish", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user._id.toString()) {
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


/* ---------------------------------------------------
   📌 7. GET TEACHER QUIZZES
-----------------------------------------------------*/
router.get("/quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch quizzes", error: err.message });
  }
});

// Get quiz results for a quiz (teacher only)
router.get('/quizzes/:id/results', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (quiz.createdBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view results' });
    }

    const results = await Result.find({ quizId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ percentage: -1, score: -1, completedAt: 1 });

    // include course category/title for context
    let courseInfo = null;
    try {
      if (quiz.courseId) {
        courseInfo = await Course.findById(quiz.courseId).select('category title');
      }
    } catch (e) {
      courseInfo = null;
    }

    const mapped = results.map((r, idx) => ({
      _id: r._id,
      user: r.userId,
      score: r.score,
      total: r.total,
      percentage: r.percentage,
      completedAt: r.completedAt,
      rank: idx + 1,
      courseCategory: courseInfo?.category || null,
      courseTitle: courseInfo?.title || null,
      // include quiz-level metadata to help frontend compute pass/fail
      passingScore: quiz.passingScore || 0,
      difficulty: quiz.difficulty || null
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch quiz results', error: err.message });
  }
});


/* ---------------------------------------------------
   📌 8. PUBLISH / UNPUBLISH QUIZ
-----------------------------------------------------*/
router.put("/quizzes/:id/publish", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
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


/* ---------------------------------------------------
   📌 9. GET STUDENTS IN TEACHER COURSES
-----------------------------------------------------*/
router.get("/students", async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    const courseIds = courses.map(c => c._id);

    const students = await User.find({
      "enrolledCourses.course": { $in: courseIds }
    }).select("name email avatar enrolledCourses createdAt");

    const mapped = students.map(student => {
      const courseIdStrs = courseIds.map(x => String(x));
      const enrolled = student.enrolledCourses.filter(e => courseIdStrs.includes(String(e.course)));

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        enrolledCourses: enrolled.length,
        joinedAt: student.createdAt
      };
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch students", error: err.message });
  }
});


/* ---------------------------------------------------
   📌 10. COURSE ANALYTICS
-----------------------------------------------------*/
router.get("/courses/:id/analytics", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const enrolled = await User.find({
      "enrolledCourses.course": req.params.id
    }).select("name email enrolledCourses");

    const studentProgress = enrolled.map(user => {
      const progress = user.enrolledCourses.find(
        e => e.course.toString() === req.params.id
      );

      return {
        name: user.name,
        email: user.email,
        progress: progress?.percentComplete || 0,
        enrolledAt: progress?.enrolledAt
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
