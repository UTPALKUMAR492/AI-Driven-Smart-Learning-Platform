import Quiz from "../models/Quiz.js";
import Result from "../models/Result.js";

export const getQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  res.json(quiz);
};

export const submitQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  const answers = req.body.responses;

  let score = 0;
  const details = [];

  quiz.questions.forEach((q) => {
    const correct = q.correctAnswer === answers[q._id];
    if (correct) score++;

    details.push({
      questionId: q._id,
      questionText: q.text,
      correct
    });
  });

  const result = await Result.create({
    userId: req.user._id,
    quizId: quiz._id,
    score,
    total: quiz.questions.length,
    details
  });

  res.json({ resultId: result._id });
};

export const getResult = async (req, res) => {
  const result = await Result.findById(req.params.id);
  res.json(result);
};
