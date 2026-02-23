const express = require("express");
const { auth } = require("../middleware/auth");
const prisma = require("../utils/prisma");

const router = express.Router();

// Update user profile (DOB)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dob } = req.body;

    if (!dob) {
      return res.status(400).json({ message: "DOB required" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { dob: new Date(dob) }
    });

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

// PUT /api/user/update-profile
router.put("/update-profile", auth, updateProfile);

module.exports = router;
