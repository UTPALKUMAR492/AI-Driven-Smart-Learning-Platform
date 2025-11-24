import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  level: { type: String, default: "Beginner" },
  topics: [
    {
      title: String,
      content: String
    }
  ]
});

export default mongoose.model("Course", courseSchema);
