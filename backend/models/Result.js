import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  details: [
    {
      questionId: String,
      questionText: String,
      userAnswer: String,
      correctAnswer: String,
      correct: Boolean
    }
  ],
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Result", resultSchema);
