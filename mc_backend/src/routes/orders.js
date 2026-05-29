const express = require("express");
const { auth } = require("../middleware/auth");
const { orderSchema } = require("../utils/validation");
const prisma = require("../utils/prisma");
const { normalizePhoneNumber } = require("../utils/phone");

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
      addressText: rawAddressText,
      latitude: rawLatitude,
      longitude: rawLongitude,
      setAsDefaultAddress,
    } = value;

    const normalizedUserPhone = normalizePhoneNumber(req?.user?.phone);
    if (!normalizedUserPhone) {
      return res.status(422).json({ error: "Phone number is required" });
    }

    const normalizeAddressText = (text) => String(text || "").trim();

    let resolvedAddressText = null;
    let latitude = typeof rawLatitude === "number" ? rawLatitude : null;
    let longitude = typeof rawLongitude === "number" ? rawLongitude : null;

    const typedAddress = normalizeAddressText(rawAddressText);
    // Only use typedAddress if it has at least 3 characters
    if (typedAddress && typedAddress.length >= 3) {
      resolvedAddressText = typedAddress;

      if (setAsDefaultAddress) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            addressLine1: typedAddress,
            isDefaultAddress: true,
          },
        });
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          addressLine1: true,
          addressLine2: true,
          landmark: true,
          city: true,
          state: true,
          pincode: true,
        },
      });

      const storedAddress = user
        ? [
            user.addressLine1,
            user.addressLine2,
            user.landmark,
            user.city,
            user.state,
            user.pincode,
          ]
            .map((v) => String(v || "").trim())
            .filter(Boolean)
            .join(", ")
        : "";

      resolvedAddressText = storedAddress || null;
    }

    if (!resolvedAddressText) {
      return res.status(400).json({
        error:
          "Delivery address is required. Please add an address in your profile.",
      });
    }

    // Validate products and calculate total
    let total = 0;
    const orderItems = [];
    const requestedVariantMeta = [];

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

      const unitPrice =
        typeof item.price === "number" && item.price > 0
          ? item.price
          : product.price;
      const itemTotal = unitPrice * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: unitPrice,
      });
      requestedVariantMeta.push({
        productId: product.id,
        quantity: item.quantity,
        color: item.color || "",
        storage: item.storage || "",
        variantId: item.variantId || item.productId || product.id,
        price: unitPrice,
        originalPrice: item.originalPrice || product.price,
        offerId: item.offerId || null,
        offerTitle: item.offerTitle || "",
        offerPrice: item.offerPrice || unitPrice,
        offerText: item.offerText || "",
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
          addressText: resolvedAddressText,
          latitude,
          longitude,
          items: {
            create: orderItems,
          },
        },
        include: {
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
    // Create admin notification for new order (cart order)
    let notificationCreated = false;
    try {
      const metaByProductId = new Map(
        requestedVariantMeta.map((item) => [String(item.productId), item]),
      );
      const detailedItems = order.items.map((item) => {
        const meta = metaByProductId.get(String(item.productId)) || {};
        const unitPrice =
          typeof item.price === "number" ? item.price : item.product.price;
        const lineTotal = Number(unitPrice) * Number(item.quantity || 0);
        return {
          name: item.product.name,
          quantity: item.quantity,
          color: meta.color || "",
          storage: meta.storage || "",
          variantId: meta.variantId || String(item.productId),
          price: Number(unitPrice),
          originalPrice: Number(meta.originalPrice || item.product.price || unitPrice),
          offerId: meta.offerId || null,
          offerTitle: meta.offerTitle || "",
          offerPrice: Number(meta.offerPrice || unitPrice),
          offerText: meta.offerText || "",
          lineTotal: Number(lineTotal),
        };
      });
      const orderItemsText = detailedItems
        .map((item) => {
          const offerPart = item.offerTitle
            ? ` | Offer: ${item.offerTitle}${item.offerText ? ` | Note: ${item.offerText}` : ""}`
            : "";
          return `${item.name} [${item.color || "Default"}, ${item.storage || "Standard"}] x${item.quantity} (INR ${Number(item.price).toFixed(2)} = INR ${Number(item.lineTotal).toFixed(2)})${offerPart}`;
        })
        .join(", ");

      // use notification service to ensure unified schema
      const { createNotification } = require("../utils/notificationService");
      await createNotification({
        // payload includes legacy fields for compatibility
        kind: "order",
        name: req.user.fullName || "Customer",
        mobileNumber: normalizedUserPhone,
        message: `New Order #${order.id} | Customer: ${req.user.fullName || "Customer"} | Phone: ${req.user.phone || ""} | Email: ${req.user.email || ""} | Items: ${orderItemsText} | Total: INR ${Number(total).toFixed(2)} | Address: ${resolvedAddressText}`,
        // unified properties
        type: "CART_ORDER",
        title: "New Cart Order",
        data: {
          orderId: order.id,
          mobileNumber: normalizedUserPhone,
          items: detailedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            color: item.color,
            storage: item.storage,
            variantId: item.variantId,
            price: item.price,
            originalPrice: item.originalPrice,
            offerId: item.offerId,
            offerTitle: item.offerTitle,
            offerPrice: item.offerPrice,
            offerText: item.offerText,
            lineTotal: item.lineTotal,
          })),
          total,
          address: resolvedAddressText,
        },
      });
      notificationCreated = true;
    } catch (notifError) {
      // fallback logic remains similar but also mark type
      try {
        const { createNotification } = require("../utils/notificationService");
        await createNotification({
          kind: "order",
          name: req.user.fullName || "Customer",
          mobileNumber: normalizedUserPhone,
          message: `New Order #${order.id} placed. Total INR ${Number(total).toFixed(2)}.`,
          type: "CART_ORDER",
          title: "New Cart Order",
          data: { orderId: order.id, total },
        });
        notificationCreated = true;
      } catch (fallbackError) {
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "notifications" ("message") VALUES ($1)`,
            `New Order #${order.id} placed. Total INR ${Number(total).toFixed(2)}.`,
          );
          notificationCreated = true;
        } catch (lastFallbackError) {
          console.error("Failed to create order notification:", notifError);
          console.error("Fallback order notification failed:", fallbackError);
          console.error(
            "Raw order notification fallback failed:",
            lastFallbackError,
          );
        }
      }
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
      notificationCreated,
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
