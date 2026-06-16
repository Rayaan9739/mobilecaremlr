const express = require("express");
const { auth } = require("../middleware/auth");
const { orderSchema } = require("../utils/validation");
const prisma = require("../utils/prisma");
const { normalizePhoneNumber } = require("../utils/phone");

const router = express.Router();
const getAuthUserId = (user) => user?._id || user?.id || user?.userId || null;
const isAdminUser = (user) =>
  Boolean(
    user &&
      String(user.role || "").toUpperCase() === "ADMIN" &&
      String(user.email || "").toLowerCase() === "admin@mobilecare.com",
  );

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
    const userId = getAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
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
          where: { id: userId },
          data: {
            addressLine1: typedAddress,
            isDefaultAddress: true,
          },
        });
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
        name: product.name,
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
    const createdOrder = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          status: "CONFIRMED",
          addressText: resolvedAddressText,
          latitude,
          longitude,
          items: {
            create: orderItems,
          },
        },
      });
      return newOrder;
    });

    // Create admin notification for new order (cart order)
    let notificationCreated = false;
    try {
      const metaByProductId = new Map(requestedVariantMeta.map((item) => [String(item.productId), item]));
      const detailedItems = items.map((item) => {
        const meta = metaByProductId.get(String(item.productId)) || {};
        const unitPrice = Number(item.price || meta.price || 0);
        const lineTotal = Number(unitPrice) * Number(item.quantity || 0);
        return {
          name: String(meta.name || item.name || item.productId || "Product"),
          productId: String(item.productId),
          quantity: item.quantity,
          color: meta.color || "",
          storage: meta.storage || "",
          variantId: meta.variantId || String(item.productId),
          price: Number(unitPrice),
          originalPrice: Number(meta.originalPrice || unitPrice),
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
        message: `New Order #${createdOrder.id} | Customer: ${req.user.fullName || "Customer"} | Phone: ${req.user.phone || ""} | Email: ${req.user.email || ""} | Items: ${orderItemsText} | Total: INR ${Number(total).toFixed(2)} | Address: ${resolvedAddressText}`,
        // unified properties
        type: "CART_ORDER",
        title: "New Cart Order",
        data: {
          orderId: createdOrder.id,
          mobileNumber: normalizedUserPhone,
            items: detailedItems.map((item) => ({
            productId: item.productId,
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
          message: `New Order #${createdOrder.id} placed. Total INR ${Number(total).toFixed(2)}.`,
          type: "CART_ORDER",
          title: "New Cart Order",
          data: { orderId: createdOrder.id, total },
        });
        notificationCreated = true;
      } catch (fallbackError) {
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "notifications" ("message") VALUES ($1)`,
            `New Order #${createdOrder.id} placed. Total INR ${Number(total).toFixed(2)}.`,
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
      order: createdOrder,
      notificationCreated,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const orderItemSelect = {
  id: true,
  quantity: true,
  price: true,
  product: {
    select: {
      id: true,
      name: true,
      images: true,
      storageOption: true,
      colorName: true,
      category: true,
      brand: true,
      description: true,
      storageVariants: true,
    },
  },
};

const getUserOrderList = async (req, res) => {
  try {
    const userId = getAuthUserId(req.user);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("Fetching orders for user:", { userId, user: req.user });

    const orders = await prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        total: true,
        addressText: true,
        items: {
          select: orderItemSelect,
        },
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!orders.length) {
      return res.json([]);
    }

    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 50, 1);
    const where = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          total: true,
          addressText: true,
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          items: {
            select: orderItemSelect,
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.max(Math.ceil(total / limitNum), 1),
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        items: { include: { product: true } },
      },
    });

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user orders
router.get("/my-orders", auth, getUserOrderList);

// Get user orders (alias)
router.get("/my", auth, getUserOrderList);

// Admin order management
router.get("/admin", auth, async (req, res, next) => {
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  return getAllOrders(req, res, next);
});

router.patch("/admin/:id/status", auth, async (req, res, next) => {
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  return updateOrderStatus(req, res, next);
});

// Get single order
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        userId: getAuthUserId(req.user),
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
