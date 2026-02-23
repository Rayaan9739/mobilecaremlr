const cloudinary = require("cloudinary").v2;
const _multerStorageCloudinary = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storageOptions = {
  cloudinary,
  params: {
    folder: "mobile-care-products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 2000, height: 2000, crop: "limit", quality: "auto:best" },
    ],
  },
};

// Support both named/class export and factory export from different package versions
const createCloudinaryStorage =
  _multerStorageCloudinary.CloudinaryStorage || _multerStorageCloudinary;
let storage;
if (typeof createCloudinaryStorage === "function") {
  try {
    // Try as constructor (class)
    storage = new createCloudinaryStorage(storageOptions);
  } catch (err) {
    // Fallback to factory function
    storage = createCloudinaryStorage(storageOptions);
  }
} else {
  throw new Error("Unsupported export from multer-storage-cloudinary");
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = { cloudinary, upload };
