const cloudinary = require("cloudinary").v2;
const prisma = require("../utils/prisma");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image (file or URL) and create asset record
exports.uploadImage = async (req, res) => {
  try {
    const { section, title, url } = req.body;
    const file = req.file;

    // Check if either file or URL is provided
    if (!file && !url) {
      return res.status(400).json({ error: "No image provided" });
    }

    let imageUrl;
    let publicId;

    // If file is provided, upload to Cloudinary
    if (file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "mobile-care-assets",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        // Convert buffer to stream
        const stream = require("stream");
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(uploadStream);
      });

      imageUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    } else {
      // Use provided URL directly (skip Cloudinary)
      imageUrl = url;
      publicId = null; // No Cloudinary public ID for external URLs
    }

    // For hero section: upsert (update if exists, create if not)
    if (section === "hero") {
      const existingHero = await prisma.imageAsset.findFirst({
        where: { section: "hero" },
      });

      // Delete old image from Cloudinary if exists and was uploaded to Cloudinary
      if (existingHero && existingHero.publicId) {
        try {
          await cloudinary.uploader.destroy(existingHero.publicId);
        } catch (err) {
          console.error("Failed to delete old image from Cloudinary:", err);
        }
      }

      // Delete existing row if exists
      if (existingHero) {
        await prisma.imageAsset.delete({ where: { id: existingHero.id } });
      }

      // Create new asset
      const asset = await prisma.imageAsset.create({
        data: {
          section: "hero",
          title: title || null,
          imageUrl: imageUrl,
          publicId: publicId || "",
        },
      });

      return res.json({
        success: true,
        id: asset.id,
        imageUrl: asset.imageUrl,
        publicId: asset.publicId,
        title: asset.title,
        section: asset.section,
      });
    }

    // For gallery section: create new row (allow multiple images)
    const asset = await prisma.imageAsset.create({
      data: {
        section: section || "gallery",
        title: title || null,
        imageUrl: imageUrl,
        publicId: publicId || "",
      },
    });

    res.json({
      success: true,
      id: asset.id,
      imageUrl: asset.imageUrl,
      publicId: asset.publicId,
      title: asset.title,
      section: asset.section,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// Get assets by section - Public endpoint (no auth required)
exports.getAssets = async (req, res) => {
  try {
    const { section } = req.query;

    if (!section) {
      return res.status(400).json({ error: "Section parameter is required" });
    }

    const assets = await prisma.imageAsset.findMany({
      where: { section },
      orderBy: { createdAt: "desc" },
    });

    // Standardize response based on section type
    if (section === "hero") {
      // Hero: Return single object with section and url
      const heroAsset = assets[0];
      return res.json({
        section: "hero",
        url: heroAsset ? heroAsset.imageUrl : null,
      });
    } else if (section === "gallery") {
      // Gallery: Return array of images
      return res.json({
        section: "gallery",
        images: assets.map((asset) => ({
          id: asset.id,
          url: asset.imageUrl,
          title: asset.title,
        })),
      });
    } else {
      // Generic section response
      return res.json(
        assets.map((asset) => ({
          id: asset.id,
          imageUrl: asset.imageUrl,
          publicId: asset.publicId,
          title: asset.title,
          section: asset.section,
        })),
      );
    }
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

// Delete asset
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    // Find asset first
    const asset = await prisma.imageAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(asset.publicId);

    // Delete from database
    await prisma.imageAsset.delete({
      where: { id },
    });

    res.json({ success: true, message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({ error: "Failed to delete asset" });
  }
};

// Update asset (title only)
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const asset = await prisma.imageAsset.update({
      where: { id },
      data: { title },
    });

    res.json({
      success: true,
      id: asset.id,
      imageUrl: asset.imageUrl,
      title: asset.title,
    });
  } catch (error) {
    console.error("Update asset error:", error);
    res.status(500).json({ error: "Failed to update asset" });
  }
};
