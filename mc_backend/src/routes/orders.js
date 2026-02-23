const express = require("express");
const { auth } = require("../middleware/auth");
const { orderSchema } = require("../utils/validation");
const prisma = require("../utils/prisma");

const router = express.Router();

// Create order (authenticated users only)
router.post("/", auth, async (req, res) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      items,
      addressId,
      addressText: rawAddressText,
      latitude: rawLatitude,
      longitude: rawLongitude,
      setAsDefaultAddress,
    } = value;

    const normalizeAddressText = (text) => String(text || "").trim();

    let resolvedAddressId = null;
    let resolvedAddressText = null;
    let latitude = typeof rawLatitude === "number" ? rawLatitude : null;
    let longitude = typeof rawLongitude === "number" ? rawLongitude : null;

    if (addressId) {
      const existingAddress = await prisma.address.findFirst({
        where: { id: addressId, userId: req.user.id },
      });
      if (!existingAddress) {
        return res.status(400).json({ error: "Invalid delivery address" });
      }
      resolvedAddressId = existingAddress.id;
      resolvedAddressText = existingAddress.addressText;
      latitude =
        typeof existingAddress.latitude === "number"
          ? existingAddress.latitude
          : latitude;
      longitude =
        typeof existingAddress.longitude === "number"
          ? existingAddress.longitude
          : longitude;
    } else {
      const typedAddress = normalizeAddressText(rawAddressText);
      if (typedAddress) {
        const existingCount = await prisma.address.count({
          where: { userId: req.user.id },
        });
        const shouldBeDefault = Boolean(setAsDefaultAddress) || existingCount === 0;

        const createdAddress = await prisma.$transaction(async (tx) => {
          if (shouldBeDefault) {
            await tx.address.updateMany({
              where: { userId: req.user.id, isDefault: true },
              data: { isDefault: false },
            });
          }

          return tx.address.create({
            data: {
              userId: req.user.id,
              addressText: typedAddress,
              latitude,
              longitude,
              isDefault: shouldBeDefault,
            },
          });
        });

        resolvedAddressId = createdAddress.id;
        resolvedAddressText = createdAddress.addressText;
      } else {
        const defaultAddress = await prisma.address.findFirst({
          where: { userId: req.user.id, isDefault: true },
        });
        if (defaultAddress) {
          resolvedAddressId = defaultAddress.id;
          resolvedAddressText = defaultAddress.addressText;
          latitude =
            typeof defaultAddress.latitude === "number"
              ? defaultAddress.latitude
              : latitude;
          longitude =
            typeof defaultAddress.longitude === "number"
              ? defaultAddress.longitude
              : longitude;
        }
      }
    }

    if (!resolvedAddressText) {
      return res.status(400).json({ error: "Delivery address is required" });
    }

    // Validate products and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res
          .status(400)
          .json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          total,
          status: "CONFIRMED",
          addressId: resolvedAddressId,
          addressText: resolvedAddressText,
          latitude,
          longitude,
          items: {
            create: orderItems,
          },
        },
        include: {
          address: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user orders (alias)
router.get("/my", auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single order
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
