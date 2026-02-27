const express = require("express");
const { auth } = require("../middleware/auth");
const prisma = require("../utils/prisma");

const router = express.Router();

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dob, fullName, phone } = req.body || {};

    const data = {};
    if (typeof fullName === "string" && fullName.trim()) {
      data.fullName = fullName.trim();
    }
    if (typeof phone === "string" && phone.trim()) {
      data.phone = phone.trim();
    }
    if (dob === null || dob === undefined || dob === "") {
      // allow clearing dob
      data.dob = null;
    } else {
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid DOB" });
      }
      data.dob = d;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        phone: true,
        dob: true,
      },
    });

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    // Prisma unique constraint (phone/email)
    if (err && err.code === "P2002") {
      return res.status(400).json({ message: "Phone number already in use" });
    }
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

// PUT /api/user/update-profile
router.put("/update-profile", auth, updateProfile);

module.exports = router;
