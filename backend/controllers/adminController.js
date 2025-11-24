import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";

export const createCourse = async (req, res) => {
  const course = await Course.create(req.body);
  res.json(course);
};

export const createQuiz = async (req, res) => {
  const quiz = await Quiz.create(req.body);
  res.json(quiz);
};
