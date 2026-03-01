const express = require("express");
const { getAssets } = require("../controllers/imageAssetController");

const router = express.Router();

// GET /api/assets?section=hero - Get hero image (public, no auth required)
// GET /api/assets?section=gallery - Get gallery images (public, no auth required)
router.get("/assets", getAssets);

module.exports = router;
