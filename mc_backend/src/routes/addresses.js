const express = require("express");
const { auth } = require("../middleware/auth");
const prisma = require("../utils/prisma");

const router = express.Router();

function normalizeAddressText(value) {
  return String(value || "").trim();
}

// Get my addresses
router.get("/my", auth, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json(addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create address
router.post("/", auth, async (req, res) => {
  try {
    const addressText = normalizeAddressText(req.body.addressText);
    const label = req.body.label ? String(req.body.label).trim() : null;
    const latitude =
      typeof req.body.latitude === "number" ? req.body.latitude : null;
    const longitude =
      typeof req.body.longitude === "number" ? req.body.longitude : null;
    const setDefault = Boolean(req.body.isDefault);

    if (!addressText || addressText.length < 3) {
      return res.status(400).json({ error: "Address is required" });
    }

    const existingCount = await prisma.address.count({
      where: { userId: req.user.id },
    });

    const shouldBeDefault = setDefault || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId: req.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: req.user.id,
          label,
          addressText,
          latitude,
          longitude,
          isDefault: shouldBeDefault,
        },
      });
    });

    res.status(201).json(address);
  } catch (error) {
    console.error("Create address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update address (also supports setting default)
router.patch("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    const data = {};
    if (typeof req.body.label === "string") data.label = req.body.label.trim();
    if (typeof req.body.addressText === "string") {
      const normalized = normalizeAddressText(req.body.addressText);
      if (normalized.length < 3) {
        return res.status(400).json({ error: "Address is required" });
      }
      data.addressText = normalized;
    }
    if (typeof req.body.latitude === "number") data.latitude = req.body.latitude;
    if (typeof req.body.longitude === "number")
      data.longitude = req.body.longitude;

    const makeDefault =
      typeof req.body.isDefault === "boolean" ? req.body.isDefault : null;

    const updated = await prisma.$transaction(async (tx) => {
      if (makeDefault === true) {
        await tx.address.updateMany({
          where: { userId: req.user.id, isDefault: true },
          data: { isDefault: false },
        });
        data.isDefault = true;
      }

      return tx.address.update({
        where: { id },
        data,
      });
    });

    res.json(updated);
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete address
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    await prisma.address.delete({ where: { id } });

    // If deleted default, promote most recent address to default
    if (address.isDefault) {
      const latest = await prisma.address.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
      });
      if (latest) {
        await prisma.address.update({
          where: { id: latest.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ message: "Address deleted" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

