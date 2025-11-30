import mongoose from "mongoose";
import Course from "../models/Course.js";
import User from "../models/User.js";

// Get all courses with filtering, sorting, search
export const getCourses = async (req, res) => {
  try {
    const {
      search,
      category,
      level,
      minPrice,
      maxPrice,
      rating,
      sortBy,
      isFree,
      page = 1,
      limit = 12
    } = req.query;

    let query = { isPublished: true };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Level filter
    if (level && level !== "All Levels") {
      query.level = level;
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Free filter
    if (isFree === "true") {
      query.isFree = true;
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sortBy === "popular") sortOption = { studentsEnrolled: -1 };
    if (sortBy === "rating") sortOption = { rating: -1 };
    if (sortBy === "newest") sortOption = { createdAt: -1 };
    if (sortBy === "price-low") sortOption = { price: 1 };
    if (sortBy === "price-high") sortOption = { price: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .populate("instructor", "name avatar"),
      Course.countDocuments(query)
    ]);

    return res.json({
      courses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        hasMore: skip + courses.length < total
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch courses", error: err.message });
  }
};

// Get single course with full details
export const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id)
      .populate("instructor", "name avatar bio headline totalStudents teachingCourses")
      .populate("reviews.user", "name avatar");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Increment view count (optional tracking)
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch course", error: err.message });
  }
};

// Create new course
export const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user._id,
      instructorName: req.user.name,
      instructorAvatar: req.user.avatar
    };

    const course = await Course.create(courseData);

    // Add to teacher's teaching courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: { teachingCourses: course._id }
    });

    return res.status(201).json(course);
  } catch (err) {
    return res.status(500).json({ message: "Could not create course", error: err.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check ownership or admin
    if (course.instructor?.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await Course.findByIdAndUpdate(
      id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true }
    );

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Could not update course", error: err.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await Course.findByIdAndDelete(id);

    // Remove from instructor's teaching courses
    if (course.instructor) {
      await User.findByIdAndUpdate(course.instructor, {
        $pull: { teachingCourses: id }
      });
    }

    return res.json({ message: "Course deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete course", error: err.message });
  }
};

// Enroll in course
export const enrollCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if already enrolled
    const user = await User.findById(userId);
    const isEnrolled = user.enrolledCourses.some(
      e => e.course.toString() === id
    );

    if (isEnrolled) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    // Calculate total lessons
    let totalLessons = 0;
    if (course.sections) {
      course.sections.forEach(s => {
        totalLessons += s.lessons.length;
      });
    }

    // Enroll user
    await User.findByIdAndUpdate(userId, {
      $push: {
        enrolledCourses: {
          course: id,
          enrolledAt: new Date(),
          totalLessons,
          completedLessons: 0,
          percentComplete: 0
        }
      }
    });

    // Increment course enrollment count
    await Course.findByIdAndUpdate(id, {
      $inc: { studentsEnrolled: 1 }
    });

    return res.json({ message: "Enrolled successfully", courseId: id });
  } catch (err) {
    return res.status(500).json({ message: "Could not enroll", error: err.message });
  }
};

// Get enrolled courses for user
export const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate({
        path: "enrolledCourses.course",
        select: "title thumbnail instructor rating totalLessons totalDuration category"
      });

    return res.json(user.enrolledCourses || []);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch enrolled courses", error: err.message });
  }
};

// Update lesson progress
export const updateProgress = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { completed, watchedDuration } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled in this course" });
    }

    // Find or create progress entry
    let progressEntry = enrollment.progress.find(
      p => p.lessonId.toString() === lessonId
    );

    if (progressEntry) {
      progressEntry.completed = completed;
      progressEntry.watchedDuration = watchedDuration;
      if (completed) progressEntry.completedAt = new Date();
    } else {
      enrollment.progress.push({
        lessonId,
        completed,
        watchedDuration,
        completedAt: completed ? new Date() : undefined
      });
    }

    // Calculate overall progress
    const completedCount = enrollment.progress.filter(p => p.completed).length;
    enrollment.completedLessons = completedCount;
    enrollment.percentComplete = Math.round(
      (completedCount / enrollment.totalLessons) * 100
    );
    enrollment.lastAccessedAt = new Date();

    await user.save();

    return res.json({
      progress: enrollment.percentComplete,
      completedLessons: completedCount
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not update progress", error: err.message });
  }
};

// Add review
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user is enrolled
    const user = await User.findById(userId);
    const isEnrolled = user.enrolledCourses.some(
      e => e.course.toString() === id
    );

    if (!isEnrolled) {
      return res.status(400).json({ message: "Must be enrolled to review" });
    }

    // Check if already reviewed
    const hasReviewed = course.reviews.some(
      r => r.user.toString() === userId.toString()
    );

    if (hasReviewed) {
      return res.status(400).json({ message: "Already reviewed this course" });
    }

    // Add review
    course.reviews.push({ user: userId, rating, comment });

    // Recalculate average rating
    const totalRatings = course.reviews.length;
    const sumRatings = course.reviews.reduce((sum, r) => sum + r.rating, 0);
    course.rating = Math.round((sumRatings / totalRatings) * 10) / 10;
    course.totalRatings = totalRatings;

    await course.save();

    return res.json({ message: "Review added", rating: course.rating });
  } catch (err) {
    return res.status(500).json({ message: "Could not add review", error: err.message });
  }
};

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Course.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return res.json(categories.map(c => ({ name: c._id, count: c.count })));
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch categories", error: err.message });
  }
};

// Get featured courses
export const getFeaturedCourses = async (req, res) => {
  try {
    const featured = await Course.find({ isFeatured: true, isPublished: true })
      .limit(6)
      .populate("instructor", "name avatar");

    const bestsellers = await Course.find({ isBestseller: true, isPublished: true })
      .limit(6)
      .populate("instructor", "name avatar");

    const newest = await Course.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("instructor", "name avatar");

    const popular = await Course.find({ isPublished: true })
      .sort({ studentsEnrolled: -1 })
      .limit(6)
      .populate("instructor", "name avatar");

    return res.json({ featured, bestsellers, newest, popular });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch featured courses", error: err.message });
  }
};

// Toggle wishlist
export const toggleWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const isInWishlist = user.wishlist.includes(id);

    if (isInWishlist) {
      await User.findByIdAndUpdate(userId, { $pull: { wishlist: id } });
      return res.json({ message: "Removed from wishlist", inWishlist: false });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: id } });
      return res.json({ message: "Added to wishlist", inWishlist: true });
    }
  } catch (err) {
    return res.status(500).json({ message: "Could not update wishlist", error: err.message });
  }
};

// Get wishlist
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "wishlist",
        select: "title thumbnail price rating studentsEnrolled instructor"
      });

    return res.json(user.wishlist || []);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch wishlist", error: err.message });
  }
};
