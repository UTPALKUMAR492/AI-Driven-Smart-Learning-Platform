import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.id) return res.status(401).json({ message: "Invalid token payload" });

      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "User not found for token" });
      if (!user.isActive) return res.status(403).json({ message: "User is deactivated" });

      req.user = user;
      return next();

    } catch (err) {
      return res.status(401).json({ message: "Unauthorized token" });
    }
  }
  res.status(401).json({ message: "No token provided" });
};

export const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  return next();
}

export const optionalAuth = async (req, res, next) => {
  try {
    if (!req.headers.authorization?.startsWith('Bearer')) return next()
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded?.id) return next()
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return next()
    if (!user.isActive) return next()
    req.user = user
    return next()
  } catch (err) {
    // Do not fail requests if token invalid – optional auth should be silent
    return next()
  }
}

export const isTeacherOrAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role === 'teacher' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Teacher or admin access required' });
}
