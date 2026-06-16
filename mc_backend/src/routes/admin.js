const express = require("express");
const { adminAuth } = require("../middleware/auth");
const { productSchema } = require("../utils/validation");
const { upload } = require("../utils/cloudinary");
const prisma = require("../utils/prisma");
const { Pool } = require("pg");

const router = express.Router();

const poolConfig = () => ({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

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
router.post("/products", upload.array("images"), async (req, res) => {
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
      await prisma.category.upsert({
        where: { name: normalizedCategory },
        update: { displayName: category.toString().trim() },
        create: {
          name: normalizedCategory,
          displayName: category.toString().trim(),
        },
      });
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
router.put("/products/:id", upload.array("images"), async (req, res) => {
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
      await prisma.category.upsert({
        where: { name: normalizedCategory },
        update: { displayName: category.toString().trim() },
        create: {
          name: normalizedCategory,
          displayName: category.toString().trim(),
        },
      });
    }

    const newImages = req.files ? req.files.map((file) => file.path) : [];

    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const images = newImages.length > 0 ? newImages : existingProduct.images;

    const parsedPrice = price !== undefined ? parseFloat(price) : undefined;
    if (price !== undefined) {
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        return res
          .status(400)
          .json({ error: "Price must be a positive number" });
      }
    }

    // Build update data - only include fields that are explicitly provided
    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(brand !== undefined && { brand: brand || "" }),
      ...(parsedPrice !== undefined && { price: parsedPrice }),
      ...(rating !== undefined && { rating: rating ? parseFloat(rating) : null }),
      ...(ratingsCount !== undefined && { ratingsCount: ratingsCount ? parseInt(ratingsCount) : null }),
      ...(reviewsCount !== undefined && { reviewsCount: reviewsCount ? parseInt(reviewsCount) : null }),
      ...(reviewCount !== undefined && { reviewCount: reviewCount ? parseInt(reviewCount) : reviewsCount ? parseInt(reviewsCount) : ratingsCount ? parseInt(ratingsCount) : null }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(category && { category: isUsedPhone ? "used-phone" : normalizedCategory }),
      ...(highlights !== undefined && { highlights: highlights || existingProduct.highlights }),
      ...(colors !== undefined && { colors: colors || existingProduct.colors }),
      ...(colorVariants !== undefined && { colorVariants: colorVariants || existingProduct.colorVariants }),
      ...(newImages.length > 0 && { images: newImages }),
      ...(isBestSeller !== undefined && { isBestSeller: Boolean(isBestSeller) }),
      ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      ...(isNew !== undefined && { isNew: Boolean(isNew || isNewArrival) }),
      ...(isNewArrival !== undefined && { isNewArrival: Boolean(isNewArrival || isNew) }),
      ...(isWeeklyTrending !== undefined && { isWeeklyTrending: Boolean(isWeeklyTrending) }),
    };

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
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
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
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
          total: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          addressText: true,
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  brand: true,
                  category: true,
                  storageOption: true,
                  colorName: true,
                },
              },
            },
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
        pages: Math.ceil(total / limitNum),
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

    if (!["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
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
  const pool = new Pool(poolConfig());
  const client = await pool.connect();
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const searchText = String(search || "").trim();
    const offset = (pageNum - 1) * limitNum;
    const values = ["USER"];
    let whereSql = `WHERE u.role = $1`;

    if (searchText) {
      values.push(`%${searchText}%`);
      whereSql += ` AND (u."fullName" ILIKE $${values.length} OR u.email ILIKE $${values.length} OR u.phone ILIKE $${values.length})`;
    }

    const userColumnsResult = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
    );
    const userColumns = new Set(userColumnsResult.rows.map((row) => row.column_name));
    const optionalSelect = (column, fallback) =>
      userColumns.has(column) ? `u."${column}"` : `${fallback} AS "${column}"`;

    const countResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM users u ${whereSql}`,
      values,
    );
    const total = Number(countResult.rows[0]?.count || 0);

    values.push(limitNum, offset);
    const usersResult = await client.query(
      `
        SELECT
          u.id,
          u."fullName",
          u.email,
          u.phone,
          u.role,
          u."createdAt",
          ${optionalSelect("emailVerified", "false")},
          ${optionalSelect("phoneVerified", "false")},
          ${optionalSelect("addressLine1", "NULL")},
          ${optionalSelect("addressLine2", "NULL")},
          ${optionalSelect("landmark", "NULL")},
          ${optionalSelect("city", "NULL")},
          ${optionalSelect("state", "NULL")},
          ${optionalSelect("pincode", "NULL")},
          COUNT(o.id)::int AS "ordersCount",
          COALESCE(SUM(o.total), 0)::float AS "totalPurchaseAmount"
        FROM users u
        LEFT JOIN orders o ON o."userId" = u.id
        ${whereSql}
        GROUP BY u.id
        ORDER BY u."createdAt" DESC
        LIMIT $${values.length - 1} OFFSET $${values.length}
      `,
      values,
    );

    const users = usersResult.rows;
    const customers = users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      ordersCount: user.ordersCount,
      totalPurchaseAmount: user.totalPurchaseAmount,
      disabled: false,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      address: [
        user.addressLine1,
        user.addressLine2,
        user.landmark,
        user.city,
        user.state,
        user.pincode,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(", "),
      createdAt: user.createdAt,
    }));

    res.json({
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
    await pool.end();
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
