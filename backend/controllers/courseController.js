import mongoose from "mongoose";
import Course from "../models/Course.js";

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch courses", error: err.message });
  }
};

export const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid course id" });
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch course", error: err.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    return res.status(201).json(course);
  } catch (err) {
    return res.status(500).json({ message: "Could not create course", error: err.message });
  }
};
