const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  verifyPasswordResetOtp,
  verifyDob,
  verifyUser,
} = require("../controllers/authController");
const prisma = require("../utils/prisma");

const router = express.Router();

// Per-email OTP limiter: max 3 requests per 15 minutes per email
const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    return email ? `forgot:${email}` : `forgot:unknown`;
  },
  message: { error: "Too many OTP requests, please try again later" },
});

// Signup
router.post("/signup", signup);

// Login
router.post("/login", login);

// Verify email
router.post("/verify-email", verifyEmail);

// Forgot password (send OTP)
router.post("/forgot-password", forgotPasswordEmailLimiter, forgotPassword);

// DOB verification (password reset step 1)
router.post("/verify-dob", verifyDob);

// Verify user by email + dob (forgot password step 1)
router.post("/verify-user", verifyUser);

// Verify reset OTP (without consuming it)
router.post("/verify-reset-otp", verifyPasswordResetOtp);

// Reset password (set new password by userId)
router.post("/reset-password", resetPassword);

// Verify token endpoint for persistent auth
router.get("/verify", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ valid: false, error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, fullName: true, phone: true },
    });

    if (!user) {
      return res.status(401).json({ valid: false, error: "User not found" });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

module.exports = router;
