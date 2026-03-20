import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false },
  text: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  published: { type: Boolean, default: false },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
}, { timestamps: true });

const Question = mongoose.model("Question", QuestionSchema);
export default Question;
