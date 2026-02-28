const cloudinary = require("cloudinary").v2;
const prisma = require("../utils/prisma");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary and create asset record
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
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
      bufferStream.end(req.file.buffer);
      bufferStream.pipe(uploadStream);
    });

    const { section, title } = req.body;

    // Create asset record in database
    const asset = await prisma.imageAsset.create({
      data: {
        section: section || "general",
        title: title || null,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
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

// Get assets by section
exports.getAssets = async (req, res) => {
  try {
    const { section } = req.query;

    const where = section ? { section } : {};

    const assets = await prisma.imageAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Return in format expected by frontend
    const formattedAssets = assets.map((asset) => ({
      id: asset.id,
      imageUrl: asset.imageUrl,
      publicId: asset.publicId,
      title: asset.title,
      section: asset.section,
    }));

    res.json(formattedAssets);
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
