const express = require("express");
const prisma = require("../utils/prisma");
const { adminAuth } = require("../middleware/auth");

const router = express.Router();

const normalizeCategoryCode = (value) => {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const buildDisplayName = (value) => {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
};

// Default categories to seed
const DEFAULT_CATEGORIES = [
  { name: "MOBILE", displayName: "Mobile Phones" },
  { name: "USED_PHONE", displayName: "Used Phones" },
  { name: "CHARGERS", displayName: "Chargers" },
  { name: "STORAGE", displayName: "Storage" },
  { name: "HEADPHONES", displayName: "Headphones" },
  { name: "CABLES", displayName: "Cables" },
  { name: "CAMERA", displayName: "Camera" },
  { name: "SMART_WATCH", displayName: "Smart Watches" },
  { name: "GAMING", displayName: "Gaming" },
  { name: "SPEAKERS", displayName: "Speakers" },
  { name: "ACCESSORIES", displayName: "Accessories" },
  { name: "ADAPTOR", displayName: "Adaptors & Converters" },
];

// Get all categories (Public)
router.get("/", async (req, res) => {
  try {
    if (!prisma.category) {
      console.error("❌ Critical: prisma.category is undefined. run 'npx prisma generate'");
      console.log("Available models:", Object.keys(prisma));
      return res.json([]);
    }

    let categories = await prisma.category.findMany({
      orderBy: { displayName: "asc" },
    });

    // Seed if empty
    if (categories.length === 0) {
      console.log("Seeding default categories...");
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES,
        skipDuplicates: true,
      });
      categories = await prisma.category.findMany({
        orderBy: { displayName: "asc" },
      });
    }

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add category (Admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    if (!prisma.category) {
      console.error("ERROR: prisma.category is undefined. run 'npx prisma generate'");
      return res.status(500).json({
        error: "Category model unavailable. Run 'npx prisma generate' and restart the server.",
      });
    }

    const { name, displayName } = req.body;

    const trimmedDisplayName =
      displayName !== undefined ? displayName.toString().trim() : "";
    const trimmedName = name !== undefined ? name.toString().trim() : "";
    const rawDisplayName = trimmedDisplayName || trimmedName;
    if (!rawDisplayName) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Ensure uppercase slug/code
    const normalizedName = normalizeCategoryCode(trimmedName || rawDisplayName);
    if (!normalizedName) {
      return res.status(400).json({ error: "Invalid category name" });
    }

    const finalDisplayName =
      trimmedDisplayName || buildDisplayName(rawDisplayName);

    const category = await prisma.category.create({
      data: {
        name: normalizedName,
        displayName: finalDisplayName,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === "P2002") {
      // Unique constraint violation
      return res.status(400).json({ error: "Category already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
