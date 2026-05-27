const express = require("express");
const { adminAuth } = require("../middleware/auth");
const { productSchema } = require("../utils/validation");
const { upload } = require("../utils/cloudinary");
const prisma = require("../utils/prisma");

const router = express.Router();

const normalizeCategoryCode = (value) => {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

// All admin routes require admin authentication
router.use(adminAuth);

// PRODUCT MANAGEMENT

// Create product
router.post("/products", upload.array("images", 5), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      rating,
      ratingsCount,
      reviewsCount,
      reviewCount,
      stock,
      category,
      brand,
      highlights,
      colors,
      colorVariants,
      isBestSeller,
      isFeatured,
      isNew,
      isNewArrival,
      isWeeklyTrending,
    } = req.body;

    // Validate required fields
    if (!name || !price || !stock || !category) {
      return res
        .status(400)
        .json({ error: "Name, price, stock, and category are required" });
    }

    const normalizedCategory = normalizeCategoryCode(category);
    if (!normalizedCategory) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const isUsedPhone = normalizedCategory === "USED_PHONE";
    if (!isUsedPhone) {
      const categoryExists = await prisma.category.findUnique({
        where: { name: normalizedCategory },
      });
      if (!categoryExists) {
        return res
          .status(400)
          .json({ error: "Invalid category. Create it in Categories first." });
      }
    }

    const images = req.files ? req.files.map((file) => file.path) : [];

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        brand: brand || "",
        price: parsedPrice,
        rating: rating ? parseFloat(rating) : null,
        ratingsCount: ratingsCount ? parseInt(ratingsCount) : null,
        reviewsCount: reviewsCount ? parseInt(reviewsCount) : null,
        reviewCount: reviewCount
          ? parseInt(reviewCount)
          : reviewsCount
            ? parseInt(reviewsCount)
            : ratingsCount
              ? parseInt(ratingsCount)
              : null,
        stock: parseInt(stock),
        category: isUsedPhone ? "used-phone" : normalizedCategory,
        highlights: highlights !== undefined ? highlights : {},
        colors: colors || colorVariants || [],
        colorVariants: colorVariants || colors || [],
        images,
        isBestSeller: Boolean(isBestSeller),
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew || isNewArrival),
        isNewArrival: Boolean(isNewArrival || isNew),
        isWeeklyTrending: Boolean(isWeeklyTrending),
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update product
router.put("/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      rating,
      ratingsCount,
      reviewsCount,
      reviewCount,
      stock,
      category,
      brand,
      highlights,
      colors,
      colorVariants,
      isBestSeller,
      isFeatured,
      isNew,
      isNewArrival,
      isWeeklyTrending,
    } = req.body;

    // Validate required fields
    if (!name || !price || !stock || !category) {
      return res
        .status(400)
        .json({ error: "Name, price, stock, and category are required" });
    }

    const normalizedCategory = normalizeCategoryCode(category);
    if (!normalizedCategory) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const isUsedPhone = normalizedCategory === "USED_PHONE";
    if (!isUsedPhone) {
      const categoryExists = await prisma.category.findUnique({
        where: { name: normalizedCategory },
      });
      if (!categoryExists) {
        return res
          .status(400)
          .json({ error: "Invalid category. Create it in Categories first." });
      }
    }

    const newImages = req.files ? req.files.map((file) => file.path) : [];

    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const images = newImages.length > 0 ? newImages : existingProduct.images;

    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        return res
          .status(400)
          .json({ error: "Price must be a positive number" });
      }
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        brand: brand || "",
        price: price !== undefined ? parseFloat(price) : undefined,
        rating: rating ? parseFloat(rating) : null,
        ratingsCount: ratingsCount ? parseInt(ratingsCount) : null,
        reviewsCount: reviewsCount ? parseInt(reviewsCount) : null,
        reviewCount: reviewCount
          ? parseInt(reviewCount)
          : reviewsCount
            ? parseInt(reviewsCount)
            : ratingsCount
              ? parseInt(ratingsCount)
              : null,
        stock: parseInt(stock),
        category: isUsedPhone ? "used-phone" : normalizedCategory, // Exact category value
        highlights: highlights !== undefined ? highlights : {},
        colors: colors || colorVariants || [],
        colorVariants: colorVariants || colors || [],
        images,
        isBestSeller: Boolean(isBestSeller),
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew || isNewArrival),
        isNewArrival: Boolean(isNewArrival || isNew),
        isWeeklyTrending: Boolean(isWeeklyTrending),
      },
    });

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all products (admin view)
router.get("/products", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const products = await prisma.product.findMany({
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.product.count();

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ORDER MANAGEMENT

// Get all orders
router.get("/orders", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = status ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update order status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    });

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DASHBOARD STATS

// CUSTOMER MANAGEMENT
router.get("/customers", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const searchText = String(search || "").trim();
    const where = {
      role: "USER",
      ...(searchText
        ? {
            OR: [
              { fullName: { contains: searchText, mode: "insensitive" } },
              { email: { contains: searchText, mode: "insensitive" } },
              { phone: { contains: searchText, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        orders: { select: { id: true, total: true, status: true } },
      },
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });
    const customers = users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      ordersCount: user.orders.length,
      totalPurchaseAmount: user.orders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      ),
      disabled: false,
      createdAt: user.createdAt,
    }));

    res.json({
      customers,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/customers/:id/disable", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, fullName: true, email: true, phone: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer disable recorded", customer: user });
  } catch (error) {
    console.error("Disable customer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      pendingOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["CONFIRMED", "DELIVERED"] } },
      }),
    ]);

    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      pendingOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
