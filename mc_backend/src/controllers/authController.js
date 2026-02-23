const bcrypt = require("../utils/bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");
const {
  signupSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  verifyDobSchema,
  verifyUserSchema,
  resetPasswordByIdSchema,
} = require("../utils/validation");
const { createOTP, sendEmailOTP, validateOTP, checkOTP } = require("../utils/otp");

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const signup = async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { fullName, email, phone, password, dob } = value;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Check if this should be admin (no admin exists)
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    const role = adminExists ? "USER" : "ADMIN";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        dob,
        role,
        emailVerified: role === "ADMIN", // Auto-verify admin
        phoneVerified: role === "ADMIN", // Auto-verify admin
      },
    });

    if (role === "ADMIN") {
      console.log("✅ First user created as ADMIN:", email);
      const token = generateToken(user.id, user.role);
      return res.status(201).json({
        message: "Admin user created successfully",
        token,
        role: user.role,
        userId: user.id,
      });
    }

    // Send email verification OTP for regular users
    try {
      const otp = await createOTP("EMAIL_VERIFICATION", email);
      await sendEmailOTP(email, otp);
    } catch (otpError) {
      console.warn("OTP sending failed:", otpError.message);
    }

    res.status(201).json({
      message:
        "User created successfully. Please verify your email with the OTP sent.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token - always succeed if credentials are valid
    const token = generateToken(user.id, user.role);

    res.json({
      token,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { error, value } = otpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { otp, email } = value;

    // Validate OTP
    await validateOTP(otp, email);

    // Update user emailVerified = true
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error.message);
    res.status(400).json({ error: error.message || "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Add validation at start
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email: validatedEmail } = value;

    const user = await prisma.user.findUnique({ where: { email: validatedEmail } });
    // Don't reveal whether email exists - always return success
    if (!user) {
      // Still return success to prevent email enumeration
      return res.json({ message: "If the email exists, an OTP will be sent" });
    }

    const otp = await createOTP("PASSWORD_RESET", validatedEmail);
    try {
      await sendEmailOTP(validatedEmail, otp);
    } catch (emailError) {
      const message =
        emailError instanceof Error ? emailError.message : "Failed to send OTP email";
      console.error("Send reset OTP email failed:", message);
      return res.status(500).json({
        error: "Failed to send OTP email",
        details: message,
      });
    }

    res.json({ message: "If the email exists, an OTP will be sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const rawNewPassword = req.body?.newPassword;
    const rawUserId = req.body?.userId;

    const userId = typeof rawUserId === "string" ? rawUserId.trim() : "";
    const newPassword = typeof rawNewPassword === "string" ? rawNewPassword : "";

    if (!userId || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { error } = resetPasswordByIdSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } catch (updateError) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { email, dob } = req.body || {};

    if (!email || !dob) {
      return res.status(400).json({ error: "Email and DOB required" });
    }

    const { error } = verifyUserSchema.validate({ email, dob });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const emailValue = String(email).trim();
    const dobValue = String(dob).trim();

    const dobDate = new Date(dobValue);
    if (Number.isNaN(dobDate.getTime())) {
      return res.status(400).json({ error: "DOB must be a valid date" });
    }

    // Match by date (not time) to avoid timezone issues with DateTime storage.
    const year = dobDate.getUTCFullYear();
    const month = dobDate.getUTCMonth();
    const day = dobDate.getUTCDate();
    const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: emailValue, mode: "insensitive" },
        dob: { gte: start, lt: end },
      },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Invalid email or DOB" });
    }

    return res.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Verify user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const verifyDob = async (req, res) => {
  try {
    const { error, value } = verifyDobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, dob } = value;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, dob: true },
    });

    // SECURITY: generic response, do not reveal existence
    if (!user || !user.dob) {
      return res.json({ message: "If details are correct you can reset password" });
    }

    const userDate = new Date(user.dob);
    const inputDate = new Date(dob);
    const sameDate =
      userDate.getFullYear() === inputDate.getFullYear() &&
      userDate.getMonth() === inputDate.getMonth() &&
      userDate.getDate() === inputDate.getDate();

    if (!sameDate) {
      return res.status(400).json({ error: "Invalid details" });
    }

    const resetToken = jwt.sign(
      { purpose: "DOB_PASSWORD_RESET", email },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    res.json({
      message: "If details are correct you can reset password",
      resetToken,
    });
  } catch (error) {
    console.error("Verify DOB error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { error, value } = otpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { otp, email } = value;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await checkOTP("PASSWORD_RESET", otp, email, null, false);
    res.json({ valid: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid OTP";
    res.status(400).json({ error: message });
  }
};

module.exports = {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  verifyPasswordResetOtp,
  verifyDob,
  verifyUser,
};
