import express from "express";
import { recommendCourses } from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/", recommendCourses);

export default router;
