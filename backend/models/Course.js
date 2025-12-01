import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["video", "article", "quiz"], default: "video" },
  content: String, // URL for video or text content
  duration: { type: Number, default: 0 }, // in minutes
  order: { type: Number, default: 0 },
  isPreview: { type: Boolean, default: false }
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [lessonSchema],
  order: { type: Number, default: 0 }
});

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "" },
  description: { type: String, required: true },
  
  // Instructor info
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  instructorName: String,
  instructorBio: String,
  instructorAvatar: String,
  
  // Media
  thumbnail: { type: String, default: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800" },
  previewVideo: String,
  
  // Categorization
  category: { type: String, required: true, default: "Development" },
  subcategory: String,
  tags: [String],
  level: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "All Levels"], default: "Beginner" },
  language: { type: String, default: "English" },
  
  // Pricing
  price: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  isFree: { type: Boolean, default: true },
  
  // Content structure
  sections: [sectionSchema],
  
  // Legacy topics support
  topics: [{
    title: String,
    content: String
  }],
  
  // Stats
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  studentsEnrolled: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // in minutes
  
  // Reviews
  reviews: [reviewSchema],
  
  // Requirements & outcomes
  requirements: [String],
  whatYouWillLearn: [String],
  targetAudience: [String],
  
  // Status
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  
  // Dates
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for search
courseSchema.index({ title: "text", description: "text", tags: "text" });

// Virtual for formatted duration
courseSchema.virtual("formattedDuration").get(function() {
  const hours = Math.floor(this.totalDuration / 60);
  const mins = this.totalDuration % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
});

// Calculate total lessons and duration before saving
courseSchema.pre("save", function(next) {
  if (this.sections && this.sections.length > 0) {
    let totalLessons = 0;
    let totalDuration = 0;
    this.sections.forEach(section => {
      totalLessons += section.lessons.length;
      section.lessons.forEach(lesson => {
        totalDuration += lesson.duration || 0;
      });
    });
    this.totalLessons = totalLessons;
    this.totalDuration = totalDuration;
  }
  next();
});

export default mongoose.model("Course", courseSchema);
