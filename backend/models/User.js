import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const progressSchema = new mongoose.Schema({
  lessonId: mongoose.Schema.Types.ObjectId,
  completed: { type: Boolean, default: false },
  watchedDuration: { type: Number, default: 0 },
  completedAt: Date
});

const enrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  enrolledAt: { type: Date, default: Date.now },
  progress: [progressSchema],
  completedLessons: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  percentComplete: { type: Number, default: 0 },
  lastAccessedAt: Date,
  certificateIssued: { type: Boolean, default: false },
  certificateIssuedAt: Date
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },
  
  // Profile
  avatar: { type: String, default: "" },
  bio: { type: String, default: "" },
  headline: { type: String, default: "" },
  
  // Social links
  website: String,
  linkedin: String,
  twitter: String,
  github: String,
  
  // Learning
  enrolledCourses: [enrollmentSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  
  // Stats
  totalQuizzesTaken: { type: Number, default: 0 },
  averageQuizScore: { type: Number, default: 0 },
  totalLearningHours: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActiveDate: Date,
  
  // Teacher specific
  teachingCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  totalStudents: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  
  // Preferences
  interests: [String],
  preferredLanguage: { type: String, default: "English" },
  
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", UserSchema);
