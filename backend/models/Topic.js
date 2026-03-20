import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  title: String,
  content: String,

  materials: [String], // PDF URLs

  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
});

export default mongoose.model("Topic", TopicSchema);
