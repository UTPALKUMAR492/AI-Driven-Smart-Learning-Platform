const mongoose = require("mongoose");

const TopicSchema = new mongoose.Schema({
  title: String,
  content: String,

  materials: [String], // PDF URLs

  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
});

module.exports = mongoose.model("Topic", TopicSchema);
