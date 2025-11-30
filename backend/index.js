import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import helmet from 'helmet'

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

// Load environment early
dotenv.config();
connectDB();

const app = express();
// Use helmet for several safe defaults (CSP configured below)
app.use(helmet())

// Configure CORS to allow the frontend dev server origin(s).
// In development we allow localhost dev ports; in production restrict to configured origin.
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean);
app.use(cors({
    origin: function(origin, callback){
        // Allow non-browser requests (e.g., curl, server-to-server) which have no origin
        if(!origin) return callback(null, true)
        // If origin is in allowed list, allow it
        if(allowedOrigins.indexOf(origin) !== -1){
            return callback(null, true)
        }
        // Otherwise, reject with an explicit error (will result in CORS failure on client)
        return callback(new Error('CORS policy: Origin not allowed'))
    },
    credentials: true
}));

app.use(express.json());

// Remove/normalize headers and set safer defaults for API responses
app.use((req, res, next) => {
    // Remove legacy or unnecessary headers reported by scanners
    res.removeHeader('X-XSS-Protection');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Expires');

    // Ensure API responses have explicit charset
    const setContentType = (val) => {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', val)
    }
    if (req.path.startsWith('/api')) {
        setContentType('application/json; charset=utf-8')
        // Prefer Cache-Control over Expires
        res.setHeader('Cache-Control', 'no-store')
        // Restrict framing via CSP frame-ancestors
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'")
    }

    next()
})

// Simple health endpoint for quick connectivity checks
app.get('/', (req, res) => {
    return res.status(200).json({ ok: true, message: 'SmartEdu backend is up' });
});

// Debug: echo endpoint to verify server-side body parsing
app.post('/debug/echo', (req, res) => {
    try {
        return res.status(200).json({ received: req.body, headers: { 'content-type': req.headers['content-type'] } });
    } catch (err) {
        return res.status(500).json({ message: 'Echo failed', error: err.message });
    }
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/student", studentRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
