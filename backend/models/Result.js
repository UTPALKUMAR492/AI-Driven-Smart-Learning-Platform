import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  score: Number,
  total: Number,
  details: [
    {
      questionId: String,
      questionText: String,
      correct: Boolean
    }
  ]
});

export default mongoose.model("Result", resultSchema);
