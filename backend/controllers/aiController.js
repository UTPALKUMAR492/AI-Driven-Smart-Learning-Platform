import mongoose from 'mongoose';
import { generateQuizWithLLM } from '../utils/llmClient.js';

// Prototype Adaptive AI endpoints (non-LLM fallback implementation)
// - generateQuiz: builds a quiz from Question bank tuned to user's past performance
// - recommendations: suggests courses/topics based on enrollments and progress

export const generateQuiz = async (req, res) => {
  try {
    const { courseId, numQuestions = 5 } = req.body;
    const userId = req.user?._id;

    // dynamic import to support mixed module models
    const QuestionModule = await import('../models/Question.js');
    const Question = QuestionModule.default || QuestionModule;
    const ResultModule = await import('../models/Result.js');
    const Result = ResultModule.default || ResultModule;

    // Fetch question bank for the course
    const questionBank = await Question.find({ course: courseId }).select('text options difficulty');
    // Fetch user performance
    let userPerformance = {};
    if (userId) {
      const recent = await Result.find({ userId, courseId }).sort({ createdAt: -1 }).limit(20);
      userPerformance = recent.map(r => ({ score: r.score, total: r.total, percentage: r.percentage, createdAt: r.createdAt }));
    }

    // Use LLM if API key is present
    if (process.env.OPENAI_API_KEY) {
      try {
        const quiz = await generateQuizWithLLM({ questionBank, userPerformance, numQuestions });
        return res.json({ quiz: { title: 'AI-Generated Quiz', questions: quiz } });
      } catch (e) {
        console.error('LLM quiz generation failed, falling back:', e.message);
      }
    }

    // Fallback: existing adaptive logic
    let targetDistribution = { easy: 0.3, medium: 0.5, hard: 0.2 };
    if (userPerformance && userPerformance.length) {
      const avg = userPerformance.reduce((s, r) => s + (r.percentage || (r.score/r.total*100)), 0) / userPerformance.length;
      if (avg < 50) targetDistribution = { easy: 0.6, medium: 0.3, hard: 0.1 };
      else if (avg < 75) targetDistribution = { easy: 0.4, medium: 0.45, hard: 0.15 };
      else targetDistribution = { easy: 0.2, medium: 0.5, hard: 0.3 };
    }
    const counts = {
      easy: Math.max(1, Math.round(numQuestions * targetDistribution.easy)),
      medium: Math.max(0, Math.round(numQuestions * targetDistribution.medium)),
      hard: Math.max(0, Math.round(numQuestions * targetDistribution.hard)),
    };
    let total = counts.easy + counts.medium + counts.hard;
    while (total > numQuestions) {
      if (counts.hard > 0) counts.hard--;
      else if (counts.medium > 0) counts.medium--;
      else counts.easy--;
      total = counts.easy + counts.medium + counts.hard;
    }
    while (total < numQuestions) {
      counts.medium++;
      total++;
    }
    const pipelineFor = (difficulty, size) => [
      { $match: { course: courseId, ...(difficulty ? { difficulty } : {}) } },
      { $sample: { size } },
      { $project: { text: 1, options: 1, difficulty: 1 } }
    ];
    const questions = [];
    for (const diff of ['easy','medium','hard']) {
      const size = counts[diff];
      if (size <= 0) continue;
      const docs = await Question.aggregate(pipelineFor(diff, size));
      questions.push(...docs.map(d => ({ id: d._id, text: d.text, options: d.options, difficulty: d.difficulty })));
    }
    if (questions.length < numQuestions) {
      const need = numQuestions - questions.length;
      const extra = await Question.aggregate([
        { $match: { course: courseId } },
        { $sample: { size: need } },
        { $project: { text:1, options:1, difficulty:1 } }
      ]);
      questions.push(...extra.map(d=>({ id: d._id, text: d.text, options: d.options, difficulty: d.difficulty })));
    }
    res.json({ quiz: { title: 'Adaptive Quiz', questions: questions.slice(0, numQuestions) } });
  } catch (err) {
    console.error('generateQuiz error', err);
    res.status(500).json({ message: 'Failed to generate quiz', error: err.message });
  }
};

export const recommendations = async (req, res) => {
  try {
    const user = req.user;
    const TopicModule = await import('../models/Topic.js');
    const Topic = TopicModule.default || TopicModule;

    // Recommend courses user started but has low completion
    const low = (user.enrolledCourses || []).filter(e => (e.percentComplete || 0) < 60).slice(0,5);

    const suggestions = [];
    for (const e of low) {
      const topics = await Topic.find({ course: e.course }).limit(5).select('title');
      suggestions.push({ course: e.course, percentComplete: e.percentComplete, topics });
    }

    // If no low-progress courses, recommend new topics from user's interests
    if (!suggestions.length) {
      const interests = user.interests || [];
      const topics = await Topic.find({ title: { $in: interests } }).limit(10).select('title course');
      res.json({ suggestions: topics });
      return;
    }

    res.json({ suggestions });
  } catch (err) {
    console.error('recommendations error', err);
    res.status(500).json({ message: 'Failed to build recommendations', error: err.message });
  }
};
