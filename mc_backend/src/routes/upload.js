const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  uploadBufferToCloudinary,
  isCloudinaryUploadError,
  uploadErrorHandler,
} = require("../utils/cloudinary");

const router = express.Router();

// Configure memory storage for streaming to Cloudinary
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    const error = new Error(
      "Only image files are allowed (jpeg, jpg, png, webp, svg)",
    );
    error.code = "UNSUPPORTED_IMAGE_TYPE";
    cb(error);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

// ✅ Upload endpoint using Cloudinary
router.post("/upload", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "mobile-care-uploads",
      resource_type: "image",
    });

    res.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (isCloudinaryUploadError(error)) {
      next(error);
      return;
    }
    res.status(500).json({ error: "Upload failed" });
  }
});

// Error handling
router.use(uploadErrorHandler);

module.exports = router;
