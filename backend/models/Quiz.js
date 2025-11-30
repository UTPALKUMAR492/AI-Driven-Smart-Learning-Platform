import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  duration: { type: Number, default: 30 }, // in minutes
  passingScore: { type: Number, default: 70 }, // percentage
  isPublished: { type: Boolean, default: false },
  questions: [
    {
      text: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctAnswer: { type: String, required: true },
      explanation: { type: String, default: "" },
      points: { type: Number, default: 1 }
    }
  ],
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
