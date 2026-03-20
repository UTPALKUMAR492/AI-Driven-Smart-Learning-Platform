import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, isTeacherOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Video upload config
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join('uploads', 'videos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const videoUpload = multer({ storage: videoStorage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max

// Notes upload config (text or PDF)
const notesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join('uploads', 'notes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const notesUpload = multer({ storage: notesStorage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max

// POST /api/upload/video
router.post('/video', protect, isTeacherOrAdmin, (req, res) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        console.warn('Video upload rejected - file too large:', { ip: req.ip, size: req.headers['content-length'] })
        return res.status(400).json({ message: 'File too large. Max 500MB allowed.' });
      }
      console.error('Video upload error', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/videos/${req.file.filename}` });
  })
});

// POST /api/upload/notes
router.post('/notes', protect, isTeacherOrAdmin, (req, res) => {
  notesUpload.single('notes')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        console.warn('Notes upload rejected - file too large:', { ip: req.ip, size: req.headers['content-length'] })
        return res.status(400).json({ message: 'File too large. Max 20MB allowed.' });
      }
      console.error('Notes upload error', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/notes/${req.file.filename}` });
  })
});

export default router;
