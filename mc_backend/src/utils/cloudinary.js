require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 60 * 1000;
const PRODUCT_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createUploadError = (message, code, cause) => {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
};

const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    let settled = false;
    let timeout;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (error) {
        const isTimeout =
          ["ETIMEDOUT", "ESOCKETTIMEDOUT"].includes(error.code) ||
          /timed?\s*out/i.test(error.message || "");
        const isInvalidImage = Number(error.http_code) === 400;

        reject(
          createUploadError(
            isTimeout
              ? "Cloudinary image upload timed out"
              : isInvalidImage
                ? "Cloudinary rejected the image"
                : "Cloudinary image upload failed",
            isTimeout
              ? "CLOUDINARY_UPLOAD_TIMEOUT"
              : isInvalidImage
                ? "INVALID_IMAGE"
                : "CLOUDINARY_UPLOAD_FAILED",
            error,
          ),
        );
        return;
      }

      if (!result?.secure_url || !result?.public_id) {
        reject(
          createUploadError(
            "Cloudinary returned an invalid upload response",
            "CLOUDINARY_UPLOAD_FAILED",
          ),
        );
        return;
      }

      resolve(result);
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        ...options,
        timeout: CLOUDINARY_UPLOAD_TIMEOUT_MS,
      },
      finish,
    );

    uploadStream.on("error", (error) => finish(error));

    timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      uploadStream.destroy();
      reject(
        createUploadError(
          "Cloudinary image upload timed out",
          "CLOUDINARY_UPLOAD_TIMEOUT",
        ),
      );
    }, CLOUDINARY_UPLOAD_TIMEOUT_MS);

    uploadStream.end(buffer);
  });

const productFileFilter = (req, file, callback) => {
  if (PRODUCT_IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    callback(null, true);
    return;
  }

  callback(
    createUploadError(
      "Only image files are allowed (jpeg, jpg, png, webp)",
      "UNSUPPORTED_IMAGE_TYPE",
    ),
  );
};

const productMemoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: productFileFilter,
});

const uploadProductImages = async (files) => {
  const uploadedFiles = [];

  try {
    for (const file of files) {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: "mobile-care-products",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { width: 2000, height: 2000, crop: "limit", quality: "auto:best" },
        ],
      });

      // Preserve the file fields consumed by the existing product routes.
      file.path = result.secure_url;
      file.size = result.bytes;
      file.filename = result.public_id;
      uploadedFiles.push(file);
    }
  } catch (error) {
    await Promise.allSettled(
      uploadedFiles.map((file) =>
        cloudinary.uploader.destroy(file.filename, { invalidate: true }),
      ),
    );
    throw error;
  }
};

const upload = {
  array(fieldName, maxCount) {
    const parseMultipart = productMemoryUpload.array(fieldName, maxCount);

    return (req, res, next) => {
      parseMultipart(req, res, async (error) => {
        if (error) {
          next(error);
          return;
        }

        try {
          await uploadProductImages(req.files || []);
          next();
        } catch (uploadError) {
          next(uploadError);
        }
      });
    };
  },
};

const isCloudinaryUploadError = (error) =>
  error?.code === "CLOUDINARY_UPLOAD_FAILED" ||
  error?.code === "CLOUDINARY_UPLOAD_TIMEOUT" ||
  error?.code === "INVALID_IMAGE";

const uploadErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "Image is too large. Maximum file size is 10 MB",
      });
    }

    return res.status(400).json({ error: "Invalid image upload request" });
  }

  if (error?.code === "UNSUPPORTED_IMAGE_TYPE") {
    return res.status(415).json({ error: error.message });
  }

  if (error?.code === "INVALID_IMAGE") {
    return res.status(400).json({ error: "Invalid image file" });
  }

  if (error?.code === "CLOUDINARY_UPLOAD_TIMEOUT") {
    return res.status(504).json({ error: "Image upload timed out" });
  }

  if (error?.code === "CLOUDINARY_UPLOAD_FAILED") {
    return res.status(502).json({ error: "Image upload failed" });
  }

  next(error);
};

module.exports = {
  cloudinary,
  upload,
  uploadBufferToCloudinary,
  isCloudinaryUploadError,
  uploadErrorHandler,
};
