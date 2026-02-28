const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { adminAuth } = require("../middleware/auth");
const {
  uploadImage,
  getAssets,
  deleteAsset,
  updateAsset,
} = require("../controllers/imageAssetController");

const router = express.Router();

// Configure multer for memory storage (we'll stream to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter,
});

// POST /api/admin/assets - Create asset (upload + save to DB)
router.post("/assets", adminAuth, upload.single("image"), uploadImage);

// GET /api/admin/assets - Get all assets or by section
router.get("/assets", adminAuth, getAssets);

// PUT /api/admin/assets/:id - Update asset title
router.put("/assets/:id", adminAuth, updateAsset);

// DELETE /api/admin/assets/:id - Delete asset
router.delete("/assets/:id", adminAuth, deleteAsset);

module.exports = router;
