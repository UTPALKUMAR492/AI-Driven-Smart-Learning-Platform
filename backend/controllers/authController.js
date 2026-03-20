import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken, generateRefreshToken, verifyToken } from "../utils/generateToken.js";

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Register attempt:', { email, requestedRole: role });

    // Sanitize public registration role: only allow 'teacher' or 'student'
    const allowedPublicRoles = ['student', 'teacher'];
    const finalRole = allowedPublicRoles.includes(role) ? role : 'student';
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: finalRole,
    });
    await user.save();

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token server-side
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ token: refreshToken, userAgent: req.get('User-Agent') || '' });
    await user.save();

    console.log('Registered user saved:', { email: user.email, role: user.role, id: user._id });

    // Set httpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      message: "Registration successful",
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('Login attempt:', { email, role, ip: req.ip });

    const user = await User.findOne({ email });
    console.log('User lookup result:', user ? { id: user._id, email: user.email, role: user.role } : null);
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: "Invalid email or user not found. Please register first." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ message: "Wrong password" });
    }

    // 🔐 If role is sent from frontend, enforce it
    if (role && user.role !== role) {
      console.log(`Login role mismatch: requested=${role} actual=${user.role}`);
      return res
        .status(403)
        .json({ message: `You are not allowed to login as ${role}` });
    }

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ token: refreshToken, userAgent: req.get('User-Agent') || '' });
    await user.save();

    // send refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log('Login successful for:', email);
    console.log('Responding with user role:', user.role);

    res.json({
      message: "Login successful",
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Refresh access token using refresh token cookie
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token provided" });

    // verify token
    let decoded;
    try {
      decoded = verifyToken(token, true);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Invalid token user" });

    // Check that refresh token exists for user
    const stored = (user.refreshTokens || []).find(rt => rt.token === token);
    if (!stored) return res.status(401).json({ message: "Refresh token revoked" });

    // rotate: issue new refresh token
    const newRefresh = generateRefreshToken(user._id);
    // replace stored token
    user.refreshTokens = (user.refreshTokens || []).filter(rt => rt.token !== token);
    user.refreshTokens.push({ token: newRefresh, userAgent: req.get('User-Agent') || '' });
    await user.save();

    // issue new access token
    const accessToken = generateToken(user._id);

    res.cookie("refreshToken", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: accessToken });
  } catch (err) {
    res.status(500).json({ message: "Failed to refresh token", error: err.message });
  }
};

// Logout and revoke refresh token
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (token && req.user) {
      req.user.refreshTokens = (req.user.refreshTokens || []).filter(rt => rt.token !== token);
      await req.user.save();
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
