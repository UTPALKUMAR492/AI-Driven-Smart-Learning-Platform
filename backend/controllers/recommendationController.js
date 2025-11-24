import Course from "../models/Course.js";

export const recommendCourses = async (req, res) => {
  const courses = await Course.find().limit(4);
  res.json(courses);
};
