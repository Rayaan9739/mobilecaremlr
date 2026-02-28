const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");

// GET content
router.get("/", async (req, res) => {
  try {
    const content = await prisma.content_settings.findFirst();
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// UPDATE content
router.post("/", async (req, res) => {
  try {
    const { hero, technicians, gallery, services } = req.body;

    const updated = await prisma.content_settings.updateMany({
      data: { hero, technicians, gallery, services }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update content" });
  }
});

module.exports = router;