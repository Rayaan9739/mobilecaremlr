const prisma = require("../utils/prisma");
const { Pool } = require("pg");
const crypto = require("crypto");

const normalizeCategoryCode = (value) => {
  if (!value) return "";
  return (
    value
      .toString()
      .trim()
      .toUpperCase()
      // eslint-disable-next-line prefer-string-replace-all
      .replace(/[^A-Z0-9]+/g, "_")
      // eslint-disable-next-line prefer-string-replace-all
      .replace(/(^_+|_+$)/g, "")
  );
};

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const parseOptionalFloat = (value) => {
  if (isBlank(value)) return null;
  const num =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isNaN(num) ? Number.NaN : num;
};

const parseOptionalInt = (value) => {
  if (isBlank(value)) return null;
  const num =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isNaN(num) ? Number.NaN : num;
};

const normalizeStringArray = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string") return [value].filter(Boolean);
  return [];
};

const normalizeJsonArray = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  // Allow a single object to be passed
  if (typeof value === "object") return [value];
  return [];
};

const normalizeColors = (value, fallback = []) => {
  const parsed = parseJSON(value);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(value)) return value;
  return Array.isArray(fallback) ? fallback : [];
};

const getProductColors = (product) => {
  const colors = normalizeColors(product.colors);
  if (colors.length > 0) return colors;
  return normalizeColors(product.colorVariants);
};

const normalizeProductResponse = (product) => {
  if (!product) return product;
  const colors = getProductColors(product);
  return {
    ...product,
    colors,
    colorVariants: Array.isArray(product.colorVariants)
      ? product.colorVariants
      : colors,
    reviewCount:
      product.reviewCount ?? product.reviewsCount ?? product.ratingsCount ?? null,
    reviewsCount:
      product.reviewsCount ?? product.reviewCount ?? product.ratingsCount ?? null,
    isNewArrival: product.isNewArrival ?? product.isNew ?? false,
  };
};

// Helper to convert empty strings to null
const emptyToNull = (v) => (v === "" || v === undefined ? null : v);

// Safe JSON parser - handles stringified JSON from frontend
const parseJSON = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off", ""].includes(normalized)) return false;
  }
  return false;
};

let productsColumnCache = null;
async function getProductsColumnInfo() {
  if (productsColumnCache) return productsColumnCache;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'products'
      `,
    );

    productsColumnCache = new Map(
      result.rows.map((row) => [
        row.column_name,
        { dataType: row.data_type, udtName: row.udt_name },
      ]),
    );

    return productsColumnCache;
  } finally {
    client.release();
    await pool.end();
  }
}

function hasColumn(columnInfo, columnName) {
  return Boolean(columnInfo && columnInfo.has(columnName));
}

function isJsonbArrayColumn(columnInfo, columnName) {
  const col = columnInfo?.get(columnName);
  return col?.udtName === "_jsonb" || col?.udtName === "_json";
}

function isTextArrayColumn(columnInfo, columnName) {
  const col = columnInfo?.get(columnName);
  return col?.udtName === "_text" || col?.udtName === "_varchar";
}

function isJsonbColumn(columnInfo, columnName) {
  const col = columnInfo?.get(columnName);
  return col?.udtName === "jsonb" || col?.udtName === "json";
}

async function createProductWithPg(data) {
  const columnInfo = await getProductsColumnInfo();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  const client = await pool.connect();

  try {
    const columns = [];
    const placeholders = [];
    const values = [];

    const add = (columnName, value, cast = "") => {
      if (!hasColumn(columnInfo, columnName)) return;
      columns.push(columnName);
      placeholders.push(`$${values.length + 1}${cast}`);
      values.push(value);
    };

    // Ensure id is generated if the table does not supply a default value
    if (hasColumn(columnInfo, "id")) {
      add("id", data.id || crypto.randomUUID());
    }

    add("name", data.name);
    add("description", data.description);
    add("brand", data.brand);
    add("price", data.price);
    add("originalPrice", data.originalPrice);
    add("discount", data.discount);
    add("rating", data.rating);
    add("ratingsCount", data.ratingsCount);
    add("reviewsCount", data.reviewsCount);
    add("reviewCount", data.reviewCount);
    add("stock", data.stock);
    add("category", data.category);
    add("createdAt", data.createdAt || new Date());
    add("updatedAt", data.updatedAt || new Date());

    if (hasColumn(columnInfo, "specs")) {
      if (isJsonbColumn(columnInfo, "specs")) {
        add("specs", JSON.stringify(data.specs ?? null), "::jsonb");
      } else {
        add("specs", data.specs);
      }
    }

    if (hasColumn(columnInfo, "highlights")) {
      if (isJsonbArrayColumn(columnInfo, "highlights")) {
        add("highlights", [JSON.stringify(data.highlights)], "::jsonb[]");
      } else if (isTextArrayColumn(columnInfo, "highlights")) {
        const textArray = Array.isArray(data.highlights)
          ? data.highlights.map((v) => String(v)).filter(Boolean)
          : [JSON.stringify(data.highlights)];
        add("highlights", textArray);
      } else if (isJsonbColumn(columnInfo, "highlights")) {
        add("highlights", JSON.stringify(data.highlights), "::jsonb");
      } else {
        add("highlights", data.highlights);
      }
    }

    if (hasColumn(columnInfo, "colorVariants")) {
      // Support both jsonb and jsonb[] schemas
      if (isJsonbArrayColumn(columnInfo, "colorVariants")) {
        const jsonArray = Array.isArray(data.colorVariants)
          ? data.colorVariants.map((v) => JSON.stringify(v))
          : [];
        add("colorVariants", jsonArray, "::jsonb[]");
      } else {
        add("colorVariants", JSON.stringify(data.colorVariants), "::jsonb");
      }
    }

    add("familyId", data.familyId);
    add("baseProductId", data.baseProductId);
    add("colorName", data.colorName);
    add("colorHex", data.colorHex);
    add("storageOption", data.storageOption);

    if (hasColumn(columnInfo, "colors")) {
      if (isJsonbColumn(columnInfo, "colors")) {
        add("colors", JSON.stringify(data.colors ?? []), "::jsonb");
      } else if (isJsonbArrayColumn(columnInfo, "colors")) {
        add(
          "colors",
          Array.isArray(data.colors) ? data.colors.map((v) => JSON.stringify(v)) : [],
          "::jsonb[]",
        );
      } else {
        add("colors", data.colors);
      }
    }

    if (hasColumn(columnInfo, "images")) {
      // Support both text[] and jsonb schemas
      if (isTextArrayColumn(columnInfo, "images")) {
        add("images", data.images);
      } else {
        add("images", JSON.stringify(data.images), "::jsonb");
      }
    }

    add("isBestSeller", data.isBestSeller);
    add("isFeatured", data.isFeatured);
    add("isNew", data.isNew);
    add("isNewArrival", data.isNewArrival);
    add("isWeeklyTrending", data.isWeeklyTrending);

    const quotedColumns = columns.map((c) =>
      /^[a-z_][a-z0-9_]*$/.test(c) ? c : `"${c}"`,
    );

    const insertSql = `
      INSERT INTO products (${quotedColumns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await client.query(insertSql, values);
    return result.rows[0];
  } finally {
    client.release();
    await pool.end();
  }
}

async function updateProductWithPg(id, data) {
  const columnInfo = await getProductsColumnInfo();
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  const client = await pool.connect();

  try {
    const setters = [];
    const values = [];

    const add = (columnName, value, cast = "") => {
      if (!hasColumn(columnInfo, columnName)) return;
      const quotedColumn = /^[a-z_][a-z0-9_]*$/.test(columnName)
        ? columnName
        : `"${columnName}"`;
      values.push(value);
      setters.push(`${quotedColumn} = $${values.length}${cast}`);
    };

    Object.entries(data).forEach(([key, value]) => {
      if (key === "highlights") {
        if (isJsonbArrayColumn(columnInfo, key)) {
          add(key, [JSON.stringify(value)], "::jsonb[]");
        } else if (isTextArrayColumn(columnInfo, key)) {
          add(
            key,
            Array.isArray(value)
              ? value.map((item) => String(item)).filter(Boolean)
              : [JSON.stringify(value)],
          );
        } else if (isJsonbColumn(columnInfo, key)) {
          add(key, JSON.stringify(value), "::jsonb");
        } else {
          add(key, value);
        }
        return;
      }

      if (key === "colorVariants") {
        if (isJsonbArrayColumn(columnInfo, key)) {
          add(
            key,
            Array.isArray(value) ? value.map((item) => JSON.stringify(item)) : [],
            "::jsonb[]",
          );
        } else if (isJsonbColumn(columnInfo, key)) {
          add(key, JSON.stringify(value), "::jsonb");
        } else {
          add(key, value);
        }
        return;
      }

      if (key === "colors") {
        if (isJsonbColumn(columnInfo, key)) {
          add(key, JSON.stringify(value ?? []), "::jsonb");
        } else if (isJsonbArrayColumn(columnInfo, key)) {
          add(
            key,
            Array.isArray(value) ? value.map((item) => JSON.stringify(item)) : [],
            "::jsonb[]",
          );
        } else {
          add(key, value);
        }
        return;
      }

      if (key === "images") {
        if (isTextArrayColumn(columnInfo, key)) {
          add(key, value);
        } else if (isJsonbColumn(columnInfo, key)) {
          add(key, JSON.stringify(value), "::jsonb");
        } else {
          add(key, value);
        }
        return;
      }

      if (key === "specs") {
        if (isJsonbColumn(columnInfo, key)) {
          add(key, JSON.stringify(value), "::jsonb");
        } else {
          add(key, value);
        }
        return;
      }

      add(key, value);
    });

    if (setters.length === 0) {
      const result = await client.query("SELECT * FROM products WHERE id = $1", [
        id,
      ]);
      return result.rows[0];
    }

    values.push(id);
    const result = await client.query(
      `
        UPDATE products
        SET ${setters.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
      `,
      values,
    );

    return result.rows[0];
  } finally {
    client.release();
    await pool.end();
  }
}

// Simple fallback for products - return empty array on error
const getProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      page = 1,
      limit = 20,
      isBestSeller,
      isFeatured,
      isNew,
      isWeeklyTrending,
      sortBy,
    } = req.query;

    // Use raw SQL query with pg directly to bypass Prisma JSON issue
    const { Pool } = require("pg");
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    const client = await pool.connect();
    
    try {
      // Build query with simple string concatenation (safe since values are from query params)
      let sql = "SELECT * FROM products WHERE 1=1";
      const values = [];
      
      if (category) {
        sql += ` AND category = $${values.length + 1}`;
        values.push(category);
      }
      if (brand) {
        sql += ` AND LOWER(brand) = LOWER($${values.length + 1})`;
        values.push(brand);
      }
      if (isBestSeller === "true") {
        sql += ` AND "isBestSeller" = true`;
      }
      if (isFeatured === "true") {
        sql += ` AND "isFeatured" = true`;
      }
      if (isNew === "true") {
        sql += ` AND "isNew" = true`;
      }
      if (isWeeklyTrending === "true") {
        const columnInfo = await getProductsColumnInfo();
        sql += hasColumn(columnInfo, "isWeeklyTrending")
          ? ` AND "isWeeklyTrending" = true AND stock > 0`
          : ` AND false`;
      }
      if (search) {
        sql += ` AND (LOWER(name) LIKE LOWER($${values.length + 1}) OR LOWER(description) LIKE LOWER($${values.length + 1}))`;
        values.push(`%${search}%`);
      }
      
      // Get count
      const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as count");
      const countResult = await client.query(countSql, values);
      const total = parseInt(countResult.rows[0].count, 10);
      
      // Get products with pagination
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const orderClause = sortBy === "bookingCount"
        ? `ORDER BY "bookingCount" DESC`
        : `ORDER BY "createdAt" DESC`;
      sql += ` ${orderClause} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(parseInt(limit, 10), offset);
      
      const result = await client.query(sql, values);
      
      const productsWithImage = result.rows.map((p) => {
        const normalized = normalizeProductResponse(p);
        return {
          ...normalized,
          isWeeklyTrending: normalized.isWeeklyTrending ?? false,
          image: normalized.images && normalized.images.length > 0 ? normalized.images[0] : "",
        };
      });
      
      res.json({
        products: productsWithImage,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error("getProducts error:", error);
    // Return empty products instead of crashing
    res.json({
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    });
  }
};

const getProduct = async (req, res) => {
  try {
    const { Pool } = require("pg");
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        "SELECT * FROM products WHERE id = $1",
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const product = normalizeProductResponse(result.rows[0]);
      const productWithImage = {
        ...product,
        isWeeklyTrending: product.isWeeklyTrending ?? false,
        image: product.images && product.images.length > 0 ? product.images[0] : "",
      };
      
      res.json({ product: productWithImage });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error("getProduct error:", error);
    res.status(500).json({ error: "Product not found" });
  }
};

const getFamilyProducts = async (req, res) => {
  try {
    const { familyId } = req.params;

    if (!familyId) {
      return res.json({ variants: [] });
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
          SELECT
            id,
            COALESCE(colorName, '') AS color,
            COALESCE(storageOption, '') AS storage
          FROM products
          WHERE familyId = $1
          ORDER BY color, storage, name
        `,
        [familyId],
      );

      res.json({
        variants: result.rows.map((row) => ({
          id: row.id,
          color: row.color || "",
          storage: row.storage || "",
        })),
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error("getFamilyProducts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    res.json(categories.map((c) => c.category));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const createProduct = async (req, res) => {
  try {
    const body = req.body || {}

    const parseJSON = (v, fallback) => {
      if (!v) return fallback
      if (typeof v === "object") return v
      try { return JSON.parse(v) } catch { return fallback }
    }

    const toNumber = (v, fallback = 0) => {
      const n = Number(v)
      return isNaN(n) ? fallback : n
    }

    const data = {
      name: body.name,
      description: body.description || null,

      brand: body.brand || "Unknown",

      price: toNumber(body.price),
      originalPrice: body.originalPrice
        ? toNumber(body.originalPrice)
        : null,

      discount: body.discount
        ? toNumber(body.discount)
        : null,
      rating: body.rating
        ? toNumber(body.rating)
        : null,
      ratingsCount: body.ratingsCount
        ? toNumber(body.ratingsCount)
        : null,
      reviewsCount: body.reviewsCount
        ? toNumber(body.reviewsCount)
        : null,
      reviewCount: body.reviewCount
        ? toNumber(body.reviewCount)
        : body.reviewsCount
          ? toNumber(body.reviewsCount)
          : body.ratingsCount
            ? toNumber(body.ratingsCount)
            : null,

      stock: toNumber(body.stock, 0),

      category: body.category,

      specs: parseJSON(body.specs, null),

      highlights: parseJSON(body.highlights, {}),

      colors: normalizeColors(body.colors, parseJSON(body.colorVariants, [])),

      colorVariants: normalizeColors(body.colorVariants, parseJSON(body.colors, [])),

      images: Array.isArray(body.images)
        ? body.images
        : [],

      familyId: body.familyId || null,
      baseProductId: body.baseProductId || null,
      colorName: body.colorName || null,
      colorHex: body.colorHex || null,
      storageOption: body.storageOption || null,

      isBestSeller: !!body.isBestSeller,
      isFeatured: !!body.isFeatured,
      isNew: !!(body.isNew || body.isNewArrival),
      isNewArrival: !!(body.isNewArrival || body.isNew),
      isWeeklyTrending: !!body.isWeeklyTrending,

      // Variant tracking fields
      baseProductId: body.baseProductId || null,
      colorName: body.colorName || null,
      colorHex: body.colorHex || null,
      storageOption: body.storageOption || null,
    }

    const product = await createProductWithPg(data)

    return res.status(201).json(product)
  } catch (error) {
    console.error("PRODUCT CREATE ERROR 👉", error)

    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    })
  }
};

/* eslint-disable sonarjs/cognitive-complexity */
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      discount,
      rating,
      ratingsCount,
      reviewsCount,
      reviewCount,
      stock,
      category,
      brand,
      specs,
      highlights,
      colors,
      colorVariants,
      isBestSeller,
      isFeatured,
      isNew,
      isNewArrival,
      isWeeklyTrending,
      images,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Validate images: max 4 images
    if (images && images.length > 4) {
      return res
        .status(400)
        .json({ error: "A product can have maximum 4 images" });
    }

    // Build update data object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (brand !== undefined) updateData.brand = brand;
    if (price !== undefined) {
      const parsedPrice =
        typeof price === "number" ? price : Number.parseFloat(String(price));
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        return res
          .status(400)
          .json({ error: "Price must be a positive number" });
      }
      updateData.price = parsedPrice;
    }
    if (originalPrice !== undefined) {
      const parsedOriginalPrice = parseOptionalFloat(originalPrice);
      if (Number.isNaN(parsedOriginalPrice)) {
        return res
          .status(400)
          .json({ error: "Original price must be a number" });
      }
      updateData.originalPrice = parsedOriginalPrice;
    }
    if (discount !== undefined) {
      const parsedDiscount = parseOptionalFloat(discount);
      if (Number.isNaN(parsedDiscount)) {
        return res.status(400).json({ error: "Discount must be a number" });
      }
      updateData.discount = parsedDiscount;
    }
    if (rating !== undefined) {
      const parsedRating = parseOptionalFloat(rating);
      if (
        Number.isNaN(parsedRating) ||
        (parsedRating !== null && (parsedRating < 0 || parsedRating > 5))
      ) {
        return res.status(400).json({ error: "Rating must be between 0 and 5" });
      }
      updateData.rating = parsedRating;
    }
    if (ratingsCount !== undefined) {
      const parsedRatingsCount = parseOptionalInt(ratingsCount);
      if (
        Number.isNaN(parsedRatingsCount) ||
        (parsedRatingsCount !== null && parsedRatingsCount < 0)
      ) {
        return res
          .status(400)
          .json({ error: "Reviews count must be a non-negative integer" });
      }
      updateData.ratingsCount = parsedRatingsCount;
    }
    if (reviewsCount !== undefined) {
      const parsedReviewsCount = parseOptionalInt(reviewsCount);
      if (
        Number.isNaN(parsedReviewsCount) ||
        (parsedReviewsCount !== null && parsedReviewsCount < 0)
      ) {
        return res
          .status(400)
          .json({ error: "Reviews count must be a non-negative integer" });
      }
      updateData.reviewsCount = parsedReviewsCount;
    }
    if (reviewCount !== undefined) {
      const parsedReviewCount = parseOptionalInt(reviewCount);
      if (
        Number.isNaN(parsedReviewCount) ||
        (parsedReviewCount !== null && parsedReviewCount < 0)
      ) {
        return res
          .status(400)
          .json({ error: "Review count must be a non-negative integer" });
      }
      updateData.reviewCount = parsedReviewCount;
    }
    if (stock !== undefined) {
      const parsedStock = parseOptionalInt(stock);
      if (
        parsedStock === null ||
        Number.isNaN(parsedStock) ||
        parsedStock < 0
      ) {
        return res
          .status(400)
          .json({ error: "Stock must be a non-negative integer" });
      }
      updateData.stock = parsedStock;
    }
    if (category !== undefined) {
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
          return res.status(400).json({
            error: "Invalid category. Create it in Categories first.",
          });
        }
      }
      updateData.category = isUsedPhone ? "used-phone" : normalizedCategory;
    }
    if (specs !== undefined) {
      updateData.specs = parseJSON(specs);
    }
    if (highlights !== undefined) {
      // Normalize highlights to always be an object for Prisma Json type
      if (Array.isArray(highlights)) {
        updateData.highlights = highlights.reduce(
          (acc, h) => ({ ...acc, [h]: "" }),
          {},
        );
      } else if (highlights && typeof highlights === "object") {
        updateData.highlights = highlights;
      } else {
        updateData.highlights = {};
      }
    }
    if (colors !== undefined) updateData.colors = normalizeColors(colors);
    if (colorVariants !== undefined) updateData.colorVariants = normalizeColors(colorVariants);
    if (images !== undefined) updateData.images = images;
    if (isBestSeller !== undefined)
      updateData.isBestSeller = parseBoolean(isBestSeller);
    if (isFeatured !== undefined)
      updateData.isFeatured = parseBoolean(isFeatured);
    if (isNew !== undefined) updateData.isNew = parseBoolean(isNew);
    if (isNewArrival !== undefined)
      updateData.isNewArrival = parseBoolean(isNewArrival);
    if (isWeeklyTrending !== undefined)
      updateData.isWeeklyTrending = parseBoolean(isWeeklyTrending);

    const product = await updateProductWithPg(req.params.id, updateData);

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { orderItems: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete related order items first
    if (product.orderItems && product.orderItems.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { productId: req.params.id },
      });
    }

    await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

module.exports = {
  getProducts,
  getProduct,
  getFamilyProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
};
