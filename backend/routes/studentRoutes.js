import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, async (req, res) => {
  res.json({
    totalQuizzes: 12,
    avgScore: 82,
    hoursSpent: 27,
    rank: 5,
    scoreDistribution: [
      { name: "Excellent", value: 40 },
      { name: "Good", value: 30 },
      { name: "Average", value: 20 },
      { name: "Poor", value: 10 }
    ]
  });
});

router.get("/recent", protect, async (req, res) => {
  res.json([
    { _id: 1, title: "JavaScript Basics Quiz", score: 90 },
    { _id: 2, title: "React Fundamentals", score: 78 },
    { _id: 3, title: "NodeJS Intro", score: 85 },
  ]);
});

router.get("/recommendations", protect, async (req, res) => {
  res.json([
    { _id: 1, title: "Advanced JavaScript", description: "Master JS concepts" },
    { _id: 2, title: "React Hooks Deep Dive", description: "Improve React skills" },
    { _id: 3, title: "Backend with Node", description: "Build scalable APIs" }
  ]);
});

export default router;
