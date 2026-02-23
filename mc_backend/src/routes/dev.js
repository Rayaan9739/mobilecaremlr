const express = require("express");
const bcrypt = require("../utils/bcrypt");
const prisma = require("../utils/prisma");

const router = express.Router();

// Development endpoint to create admin (remove in production)
router.post("/create-admin", async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return res.json({
        message: "Admin already exists",
        email: existingAdmin.email,
      });
    }

    // Create admin
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: {
        fullName: "Admin User",
        email: "admin@mobilecare.com",
        phone: "1234567890",
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
        phoneVerified: true,
      },
    });

    res.json({
      message: "Admin created successfully",
      email: "admin@mobilecare.com",
      password: "admin123",
      role: "ADMIN",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
