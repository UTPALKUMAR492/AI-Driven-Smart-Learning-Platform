import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  title: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  questions: [
    {
      text: String,
      options: [String],
      correctAnswer: String
    }
  ]
});

export default mongoose.model("Quiz", quizSchema);
