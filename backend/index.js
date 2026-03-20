import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";

import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import uploadRoutes from './routes/uploadRoutes.js';
import quizRoutes from "./routes/quizRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

import aiRoutes from "./routes/aiRoutes.js";
import questionAIRoutes from './routes/questionAIRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import errorHandler from './middleware/errorHandler.js';

connectDB();

const app = express();

/* -------------------------------------
   🔐 SECURITY (SAFE DEFAULTS)
--------------------------------------*/
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* -------------------------------------
   🌐 CORS FIXED FOR FRONTEND
--------------------------------------*/
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman or server request
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: Origin not allowed"));
    },
    credentials: true,
  })
);

/* -------------------------------------
   📦 BODY PARSER
--------------------------------------*/
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* -------------------------------------
   🛡 CUSTOM SECURITY HEADERS
--------------------------------------*/
app.use((req, res, next) => {
  res.removeHeader("X-XSS-Protection");
  res.removeHeader("X-Frame-Options");
  res.removeHeader("Expires");

  if (req.path.startsWith("/api")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
  }

  next();
});

/* -------------------------------------
   🚑 HEALTH CHECK
--------------------------------------*/
app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "SmartLearning backend is running 🚀",
  });
});

/* -------------------------------------
   🧪 DEBUG ECHO
--------------------------------------*/
app.post("/debug/echo", (req, res) => {
  try {
    res.status(200).json({
      received: req.body,
      headers: { "content-type": req.headers["content-type"] },
    });
  } catch (err) {
    res.status(500).json({ message: "Echo failed", error: err.message });
  }
});

/* -------------------------------------
   📌 ALL ROUTES (API)
--------------------------------------*/
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/student", studentRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/ai/question", questionAIRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);

/* -------------------------------------
   📂 STATIC UPLOADS
--------------------------------------*/
app.use("/uploads", express.static("uploads"));

// Global error handler (handle Multer & validation errors)
app.use(errorHandler);

/* -------------------------------------
  🚀 START SERVER (only when not testing)
--------------------------------------*/

// --- SOCKET.IO SERVER SETUP ---
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';

const START_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_TRIES = 5;
let io;

const startServer = (port, retries = 0) => {
  const server = createServer(app);
  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    maxHttpBufferSize: 5e7 // 50MB for file sharing
  });

  // In-memory chat history (for demo)
  const chatHistory = [];

  io.on('connection', (socket) => {
    socket.on('join', (room) => {
      socket.join(room);
      socket.emit('history', chatHistory.filter(msg => msg.room === room));
    });

    socket.on('chat', (msg) => {
      chatHistory.push(msg);
      io.to(msg.room).emit('chat', msg);
    });

    socket.on('file', ({ room, fileName, fileData }) => {
      const uploadDir = path.join('uploads', 'chat');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, `${Date.now()}_${fileName}`);
      fs.writeFileSync(filePath, fileData, 'base64');
      const fileUrl = `/uploads/chat/${path.basename(filePath)}`;
      io.to(room).emit('file', { fileName, fileUrl, sender: socket.id, time: Date.now() });
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retries < MAX_PORT_TRIES) {
        const nextPort = port + 1;
        console.warn(`Port ${port} in use, trying ${nextPort}...`);
        setTimeout(() => startServer(nextPort, retries + 1), 500);
      } else {
        console.error(`Port ${port} in use after ${MAX_PORT_TRIES} attempts. Please stop the other process or set PORT manually.`);
        process.exit(1);
      }
    } else {
      console.error('Server error', err);
      process.exit(1);
    }
  });

  server.listen(port, () => console.log(`🚀 Server + Socket.io running on port ${port}`));
};

if (process.env.NODE_ENV !== 'test') {
  startServer(START_PORT);
}

export default app;
