const express = require("express");
const { auth } = require("../middleware/auth");
const prisma = require("../utils/prisma");

const router = express.Router();

// Get user address
router.get("/my", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        landmark: true,
        isDefaultAddress: true,
      },
    });

    // Return address as a single object
    const address = user && (user.addressLine1 || user.city || user.state || user.pincode)
      ? {
          id: "main",
          addressLine1: user.addressLine1 || "",
          addressLine2: user.addressLine2 || "",
          city: user.city || "",
          state: user.state || "",
          pincode: user.pincode || "",
          landmark: user.landmark || "",
          isDefaultAddress: user.isDefaultAddress,
        }
      : null;

    res.json(address);
  } catch (error) {
    console.error("Get address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Save/update user address
router.post("/", auth, async (req, res) => {
  try {
    const { addressLine1 } = req.body;

    if (!addressLine1 || addressLine1.length < 3) {
      return res.status(400).json({ error: "Address is required" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        addressLine1: addressLine1,
        addressLine2: null,
        city: null,
        state: null,
        pincode: null,
        landmark: null,
        isDefaultAddress: true,
      },
      select: {
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        landmark: true,
        isDefaultAddress: true,
      },
    });

    res.json({
      id: "main",
      addressLine1: updatedUser.addressLine1,
      addressLine2: updatedUser.addressLine2,
      city: updatedUser.city,
      state: updatedUser.state,
      pincode: updatedUser.pincode,
      landmark: updatedUser.landmark,
      isDefaultAddress: updatedUser.isDefaultAddress,
    });
  } catch (error) {
    console.error("Save address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update address (PATCH)
router.patch("/:id", auth, async (req, res) => {
  try {
    const { addressLine1 } = req.body;

    const data = {};
    if (typeof addressLine1 === "string" && addressLine1.length >= 3) {
      data.addressLine1 = addressLine1;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        landmark: true,
        isDefaultAddress: true,
      },
    });

    res.json({
      id: "main",
      addressLine1: updatedUser.addressLine1,
      addressLine2: updatedUser.addressLine2,
      city: updatedUser.city,
      state: updatedUser.state,
      pincode: updatedUser.pincode,
      landmark: updatedUser.landmark,
      isDefaultAddress: updatedUser.isDefaultAddress,
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete address
router.delete("/:id", auth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        pincode: null,
        landmark: null,
        isDefaultAddress: false,
      },
    });

    res.json({ message: "Address deleted" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
