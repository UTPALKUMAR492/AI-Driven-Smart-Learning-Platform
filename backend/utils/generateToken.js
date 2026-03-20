import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  // short-lived access token
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (id) => {
  // long-lived refresh token
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const verifyToken = (token, refresh = false) => {
  const secret = refresh ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) : process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};
