import Quiz from "../models/Quiz.js";
import Result from "../models/Result.js";
import Course from "../models/Course.js";

// Get all quizzes with optional filters
export const getAllQuizzes = async (req, res) => {
  try {
    const { courseId, difficulty, search } = req.query;
    let filter = { isPublished: true };
    
    if (courseId) filter.courseId = courseId;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const quizzes = await Quiz.find(filter)
      .populate('courseId', 'title')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quizzes" });
  }
};

// Get a single quiz
export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('createdBy', 'name avatar');
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz" });
  }
};

// Create a new quiz (Teacher/Admin)
export const createQuiz = async (req, res) => {
  try {
    const { title, description, courseId, difficulty, duration, passingScore, questions, isPublished } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: "Title and at least one question required" });
    }

    // If courseId provided, verify it exists and user owns it (for teachers)
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      // Teachers can only add quizzes to their own courses
      if (req.user.role === 'teacher' && course.instructor?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Can only add quizzes to your own courses" });
      }
    }

    const quiz = await Quiz.create({
      title,
      description,
      courseId,
      createdBy: req.user._id,
      difficulty: difficulty || 'Beginner',
      duration: duration || 30,
      passingScore: passingScore || 70,
      questions,
      isPublished: isPublished || false
    });

    await quiz.populate('createdBy', 'name avatar');

    res.status(201).json(quiz);
  } catch (error) {
    console.error("Create quiz error:", error);
    res.status(500).json({ message: "Error creating quiz", error: error.message });
  }
};

// Update a quiz (Owner or Admin)
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check ownership - teachers can only update their own quizzes
    if (req.user.role === 'teacher' && quiz.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this quiz" });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    ).populate('createdBy', 'name avatar');

    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ message: "Error updating quiz", error: error.message });
  }
};

// Delete a quiz (Owner or Admin)
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check ownership - teachers can only delete their own quizzes
    if (req.user.role === 'teacher' && quiz.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    
    // Also delete related results
    await Result.deleteMany({ quizId: req.params.id });

    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting quiz", error: error.message });
  }
};

// Get teacher's own quizzes
export const getTeacherQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quizzes", error: error.message });
  }
};

// Submit quiz answers
export const submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    const answers = req.body.responses;

    let score = 0;
    const details = [];

    quiz.questions.forEach((q) => {
      const userAnswer = answers[q._id];
      const correct = q.correctAnswer === userAnswer;
      if (correct) score++;

      details.push({
        questionId: q._id,
        questionText: q.text,
        userAnswer: userAnswer || "Not answered",
        correctAnswer: q.correctAnswer,
        correct
      });
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);

    const result = await Result.create({
      userId: req.user._id,
      quizId: quiz._id,
      score,
      total: quiz.questions.length,
      percentage,
      details,
      completedAt: new Date()
    });

    res.json({ 
      resultId: result._id, 
      score, 
      total: quiz.questions.length,
      percentage 
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    res.status(500).json({ message: "Error submitting quiz" });
  }
};

// Get quiz result
export const getResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('quizId', 'title')
      .populate('userId', 'name email');
    
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching result" });
  }
};

// Get user's quiz history
export const getUserQuizHistory = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user._id })
      .populate('quizId', 'title')
      .sort({ completedAt: -1 })
      .limit(20);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz history" });
  }
};
