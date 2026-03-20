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

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (level && level !== "All Levels") {
      query.level = level;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (isFree === "true") {
      query.isFree = true;
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

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

    let course = await Course.findById(id)
      .populate("instructor", "name avatar bio headline totalStudents teachingCourses")
      .populate("reviews.user", "name avatar");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Ensure legacy `lessons` field is present for frontend compatibility.
    let courseObj = course.toObject({ virtuals: true });
    if ((!courseObj.lessons || courseObj.lessons.length === 0) && courseObj.sections && courseObj.sections.length > 0) {
      // Flatten section lessons into legacy lessons array
      const flat = [];
      courseObj.sections.forEach(section => {
        if (Array.isArray(section.lessons)) {
          section.lessons.forEach(lesson => {
                flat.push({
                  _id: lesson._id || undefined,
                  title: lesson.title || lesson.name || 'Lesson',
                  description: lesson.description || '',
                  videoUrl: lesson.content || lesson.videoUrl || '',
                  duration: lesson.duration || 0,
                  isFree: lesson.isPreview || lesson.isFree || false,
                  notes: lesson.notes || ''
                });
          });
        }
      });
      courseObj.lessons = flat;
    }

    // If request came with optional auth, indicate whether current user is enrolled
    try {
      if (req.user) {
        const user = req.user
        const enrollment = (user.enrolledCourses || []).find(e => String(e.course) === String(id))
        const enrolled = Boolean(enrollment)
        courseObj.isEnrolled = enrolled
        courseObj.userProgress = {
          percentComplete: enrollment?.percentComplete || 0,
          completedLessons: enrollment?.completedLessons || 0,
          totalLessons: enrollment?.totalLessons || courseObj.totalLessons || 0,
          progressEntries: (enrollment?.progress || []).map(p => ({ lessonId: String(p.lessonId), completed: !!p.completed }))
        }

        // If we have progress entries, mark flattened lessons as completed when ids match
        if (courseObj.lessons && Array.isArray(courseObj.lessons) && courseObj.userProgress.progressEntries.length) {
          const map = {}
          courseObj.userProgress.progressEntries.forEach(pe => { map[String(pe.lessonId)] = pe.completed })
          courseObj.lessons = courseObj.lessons.map(l => ({ ...l, completed: l._id ? !!map[String(l._id)] : false }))
        }
      }
    } catch (e) {
      // ignore and continue
    }

      // Collect downloadable notes (PDFs / notes links) from lessons and sections
      try {
        const notesSet = new Set();
        if (Array.isArray(courseObj.lessons)) {
          courseObj.lessons.forEach(l => { if (l && l.notes) notesSet.add(l.notes) });
        }
        if (Array.isArray(courseObj.sections)) {
          courseObj.sections.forEach(section => {
            if (Array.isArray(section.lessons)) {
              section.lessons.forEach(lesson => { if (lesson && lesson.notes) notesSet.add(lesson.notes) });
            }
          });
        }
        courseObj.notes = Array.from(notesSet);
      } catch (e) {
        // ignore notes aggregation errors
        courseObj.notes = courseObj.notes || [];
      }

      return res.json(courseObj);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch course", error: err.message });
  }
};

// ⭐⭐⭐ UPDATED: Create new course (FULLY FIXED)
export const createCourse = async (req, res) => {
  console.log("Incoming Course Data:", req.body);

  try {
    let thumbnail = "";

    if (req.file) {
      thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    // 🔥 Convert lessons → sections automatically
    let sections = [];

    if (req.body.lessons && Array.isArray(req.body.lessons)) {
      sections = [
        {
          title: "Course Content",
          order: 1,
          lessons: req.body.lessons.map((l, index) => ({
            title: l.title,
            content: l.videoUrl || "",
              notes: l.notes || '',
            type: "video",
            duration: l.duration || 0,
            order: index + 1,
            isPreview: l.isFree || false
          }))
        }
      ];
    }

    // Normalize price input (accept number or { amount })
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

      // store numeric price fields (legacy schema)
      price: amount,
      originalPrice: req.body.originalPrice || amount,
      isFree: amount === 0,

      thumbnail: thumbnail || req.body.thumbnail || "",
      instructor: req.user._id,
      instructorName: req.user.name,
      instructorAvatar: req.user.avatar,

      requirements: req.body.requirements || [],
      whatYouWillLearn: req.body.whatYouWillLearn || [],

      sections,

      totalLessons: req.body.lessons?.length || 0,
      totalDuration: req.body.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0)
    };

    // Backwards-compatibility: also store a legacy `lessons` array used by frontend CourseDetails
    if (req.body.lessons && Array.isArray(req.body.lessons)) {
      courseData.lessons = req.body.lessons.map(l => ({
        title: l.title || l.name || 'Lesson',
        description: l.description || '',
        videoUrl: l.videoUrl || l.content || '',
        duration: l.duration || 0,
        isFree: l.isFree || false,
        notes: l.notes || ''
      }))
    }

    // Only admins can publish directly. Teachers' courses stay unpublished until approved.
    if (req.user.role === 'admin') {
      courseData.isPublished = req.body.isPublished !== undefined ? req.body.isPublished : true;
    } else {
      courseData.isPublished = false;
    }

    const course = await Course.create(courseData);

    await User.findByIdAndUpdate(req.user._id, {
      $push: { teachingCourses: course._id }
    });

    return res.status(201).json(course);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid course data', error: err.message });
    }
    return res.status(500).json({
      message: "Could not create course",
      error: err.message
    });
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

    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let thumbnail = course.thumbnail;

    if (req.file) {
      thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    // Prevent non-admins from publishing
    if (req.body.isPublished !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change publish status' });
    }

    // Normalize price if provided (accept number or { amount })
    const updateData = { ...req.body };
    if (req.body.price !== undefined) {
      const amount = typeof req.body.price === 'number'
        ? req.body.price
        : (req.body.price && typeof req.body.price === 'object')
          ? (req.body.price.amount || 0)
          : (req.body.price?.amount || 0);
      updateData.price = amount;
      updateData.originalPrice = req.body.originalPrice || amount;
      updateData.isFree = amount === 0;
    }

    // If lessons provided, also update legacy `lessons` array for frontend compatibility
    if (req.body.lessons && Array.isArray(req.body.lessons)) {
      updateData.lessons = req.body.lessons.map(l => ({
        title: l.title || l.name || 'Lesson',
        description: l.description || '',
        videoUrl: l.videoUrl || l.content || '',
        duration: l.duration || 0,
        isFree: l.isFree || false,
        notes: l.notes || ''
      }))
      // also update sections to include notes for persisted section lessons
      updateData.sections = [
        {
          title: 'Course Content',
          order: 1,
          lessons: req.body.lessons.map((l, index) => ({
            title: l.title || l.name || `Lesson ${index+1}`,
            content: l.videoUrl || l.content || '',
            notes: l.notes || '',
            type: 'video',
            duration: l.duration || 0,
            order: index + 1,
            isPreview: l.isFree || false
          }))
        }
      ]
    }

    const updated = await Course.findByIdAndUpdate(
      id,
      {
        ...updateData,
        thumbnail,
        lastUpdated: Date.now()
      },
      { new: true }
    );

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({
      message: "Could not update course",
      error: err.message
    });
  }
};

// Admin publish/unpublish course
export const setPublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // only admin allowed — route protected by isAdmin middleware
    const publish = req.body.publish === undefined ? true : !!req.body.publish;
    course.isPublished = publish;
    await course.save();
    return res.json({ message: `Course ${publish ? 'published' : 'unpublished'}`, course });
  } catch (err) {
    return res.status(500).json({ message: 'Could not change publish status', error: err.message });
  }
}

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

    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Course.findByIdAndDelete(id);

    await User.findByIdAndUpdate(course.instructor, {
      $pull: { teachingCourses: id }
    });

    return res.json({ message: "Course deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Could not delete course",
      error: err.message
    });
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

    const user = await User.findById(userId);
    const isEnrolled = user.enrolledCourses.some(
      (e) => e.course.toString() === id
    );

    if (isEnrolled) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    let totalLessons = 0;
    if (course.sections) {
      course.sections.forEach((s) => {
        totalLessons += s.lessons.length;
      });
    }

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

    // Award first-enrollment badge (simple gamification)
    try {
      const updatedUser = await User.findById(userId);
      const enrolledCount = updatedUser.enrolledCourses?.length || 0;
      if (enrolledCount === 1) {
        const hasBadge = (updatedUser.badges || []).some(b => b.id === 'first-enroll');
        if (!hasBadge) {
          updatedUser.badges = updatedUser.badges || [];
          updatedUser.badges.push({ id: 'first-enroll', name: 'First Enrollment', description: 'Enrolled in your first course', awardedAt: new Date() });
          await updatedUser.save();
        }
      }
    } catch (e) {
      console.warn('Badge award failed', e.message);
    }

    await Course.findByIdAndUpdate(id, {
      $inc: { studentsEnrolled: 1 }
    });

    return res.json({ message: "Enrolled successfully", courseId: id });
  } catch (err) {
    return res.status(500).json({ message: "Could not enroll", error: err.message });
  }
};

// Get enrolled courses
export const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "enrolledCourses.course",
      select:
        "title thumbnail instructor rating totalLessons totalDuration category"
    });

    return res.json(user.enrolledCourses || []);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch enrolled courses",
      error: err.message
    });
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
      (e) => e.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled in this course" });
    }

    let progressEntry = enrollment.progress.find(
      (p) => p.lessonId.toString() === lessonId
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

    const completedCount = enrollment.progress.filter((p) => p.completed)
      .length;
    enrollment.completedLessons = completedCount;
    enrollment.percentComplete = Math.round(
      (completedCount / enrollment.totalLessons) * 100
    );
    enrollment.lastAccessedAt = new Date();

    await user.save();

    // Award progress badges at thresholds
    try {
      const percent = enrollment.percentComplete;
      const badgeMap = [
        { thresh: 25, id: 'progress-25', name: '25% Progress', desc: 'Reached 25% course progress' },
        { thresh: 50, id: 'progress-50', name: '50% Progress', desc: 'Reached 50% course progress' },
        { thresh: 75, id: 'progress-75', name: '75% Progress', desc: 'Reached 75% course progress' },
        { thresh: 100, id: 'course-complete', name: 'Course Complete', desc: 'Completed the course' }
      ];
      const userDoc = await User.findById(userId);
      userDoc.badges = userDoc.badges || [];
      for (const b of badgeMap) {
        if (percent >= b.thresh) {
          const exists = userDoc.badges.some(x => x.id === b.id && x.courseId?.toString() === courseId?.toString());
          if (!exists) {
            userDoc.badges.push({ id: b.id, name: b.name, description: b.desc, awardedAt: new Date(), courseId });
          }
        }
      }
      await userDoc.save();
    } catch (e) {
      console.warn('Progress badge error', e.message);
    }

    return res.json({
      progress: enrollment.percentComplete,
      completedLessons: completedCount
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not update progress",
      error: err.message
    });
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

    const user = await User.findById(userId);
    const isEnrolled = user.enrolledCourses.some(
      (e) => e.course.toString() === id
    );

    if (!isEnrolled) {
      return res.status(400).json({ message: "Must be enrolled to review" });
    }

    const hasReviewed = course.reviews.some(
      (r) => r.user.toString() === userId.toString()
    );

    if (hasReviewed) {
      return res.status(400).json({ message: "Already reviewed this course" });
    }

    course.reviews.push({ user: userId, rating, comment });

    const totalRatings = course.reviews.length;
    const sumRatings = course.reviews.reduce((sum, r) => sum + r.rating, 0);
    course.rating = Math.round((sumRatings / totalRatings) * 10) / 10;
    course.totalRatings = totalRatings;

    await course.save();

    return res.json({ message: "Review added", rating: course.rating });
  } catch (err) {
    return res.status(500).json({
      message: "Could not add review",
      error: err.message
    });
  }
};

// Rate a course
export const rateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    // Add or update review
    const existingReview = course.reviews.find(r => r.user.toString() === userId.toString());
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.createdAt = new Date();
    } else {
      course.reviews.push({ user: userId, rating, comment });
    }
    await course.save();
    res.json({ message: "Course rated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Could not rate course", error: err.message });
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

    return res.json(
      categories.map((c) => ({ name: c._id, count: c.count }))
    );
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch categories",
      error: err.message
    });
  }
};

// Get featured courses
export const getFeaturedCourses = async (req, res) => {
  try {
    const featured = await Course.find({
      isFeatured: true,
      isPublished: true
    })
      .limit(6)
      .populate("instructor", "name avatar");

    const bestsellers = await Course.find({
      isBestseller: true,
      isPublished: true
    })
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

    return res.json({
      featured,
      bestsellers,
      newest,
      popular
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch featured courses",
      error: err.message
    });
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
      await User.findByIdAndUpdate(userId, {
        $pull: { wishlist: id }
      });
      return res.json({
        message: "Removed from wishlist",
        inWishlist: false
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { wishlist: id }
      });
      return res.json({
        message: "Added to wishlist",
        inWishlist: true
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Could not update wishlist",
      error: err.message
    });
  }
};

// Remove from wishlist (DELETE)
export const removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isInWishlist = user.wishlist.includes(id);
    if (!isInWishlist) {
      return res.status(400).json({ message: "Course not in wishlist" });
    }
    await User.findByIdAndUpdate(userId, { $pull: { wishlist: id } });
    return res.json({ message: "Removed from wishlist", inWishlist: false });
  } catch (err) {
    return res.status(500).json({ message: "Could not remove from wishlist", error: err.message });
  }
};

// Get wishlist
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      select:
        "title thumbnail price rating studentsEnrolled instructor"
    });

    return res.json(user.wishlist || []);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch wishlist",
      error: err.message
    });
  }
};
