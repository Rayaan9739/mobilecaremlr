// Trigger restart due to EADDRINUSE fix
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("node:path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
console.log("[server] authRoutes imported, typeof =", typeof authRoutes);
const userRoutes = require("./routes/user");
console.log("[server] userRoutes imported, typeof =", typeof userRoutes);
const productRoutes = require("./routes/products");
console.log("[server] productRoutes imported, typeof =", typeof productRoutes);
const categoryRoutes = require("./routes/categories");
console.log(
  "[server] categoryRoutes imported, typeof =",
  typeof categoryRoutes,
);
const orderRoutes = require("./routes/orders");
const publicResourceRoutes = require("./routes/publicResources");
console.log("[server] orderRoutes imported, typeof =", typeof orderRoutes);
const addressRoutes = require("./routes/addresses");
console.log("[server] addressRoutes imported, typeof =", typeof addressRoutes);
const adminRoutes = require("./routes/admin");
console.log("[server] adminRoutes imported, typeof =", typeof adminRoutes);
const uploadRoutes = require("./routes/upload");
console.log("[server] uploadRoutes imported, typeof =", typeof uploadRoutes);
const devRoutes = require("./routes/dev");
console.log("[server] devRoutes imported, typeof =", typeof devRoutes);
const contentRoutes = require("./routes/content"); // ✅ NEW
const assetRoutes = require("./routes/assets");
const publicAssetRoutes = require("./routes/publicAssets"); // Public asset routes
const technicianRoutes = require("./routes/technicians"); // Technicians routes
const adminResourceRoutes = require("./routes/adminResources");
console.log("[server] contentRoutes imported, typeof =", typeof contentRoutes);
const prisma = require("./utils/prisma");
const { ensureAdminExists } = require("./utils/ensureAdmin");

const app = express();
app.set("trust proxy", 1);

async function testDatabaseConnection() {
  try {
    console.log("⏳ Connecting to database...");
    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Database connection timed out (5s)")),
        5000,
      ),
    );

    await Promise.race([prisma.$connect(), timeout]);

    console.log("✅ Database connected successfully");

    const userCount = await prisma.user.count();
    console.log(`📊 Database stats: ${userCount} users`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
}

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
  "https://mobilecaremlr.vercel.app",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

const isAllowedLocalOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost") return true;

    const parts = hostname.split(".");
    if (parts.length === 4) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      if (p1 === 127) return true;
      if (p1 === 10) return true;
      if (p1 === 192 && p2 === 168) return true;
      if (p1 === 172 && (p2 >= 16 && p2 <= 31)) return true;
    }
    return false;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || isAllowedLocalOrigin(origin)) {
        return callback(null, true);
      }

      // Allow any Vercel deployment (preview deployments)
      if (origin.includes("vercel.app")) return callback(null, true);

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

console.log(`🔒 CORS configured for origins: ${allowedOrigins.join(", ")}`);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  }),
);

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many OTP requests, please try again later",
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "../uploads")),
);

// Routes
app.use("/api/auth", otpLimiter, authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", uploadRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/content", contentRoutes); // ✅ NEW CONTENT API
app.use("/api/admin", assetRoutes);
app.use("/api", publicAssetRoutes); // Public asset routes (GET only)
app.use("/api", publicResourceRoutes);
app.use("/api/technicians", technicianRoutes); // Technicians API
app.use("/api/admin/resources", adminResourceRoutes);
const notificationsRoutes = require("./routes/notifications");
console.log(
  "[server] notificationsRoutes imported (inline), typeof =",
  typeof notificationsRoutes,
);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin/notifications", notificationsRoutes);

// Health endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "OK",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      database: "Disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

let initPromise;

async function init() {
  if (!initPromise) {
    initPromise = (async () => {
      await testDatabaseConnection();
      await ensureAdminExists();
    })();
  }
  return initPromise;
}

module.exports = { app, init };

if (require.main === module) {
  // default port should match frontend expectations
  const PORT = Number(process.env.PORT || 5000);

  init()
    .then(() => {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 API server listening on all interfaces at port ${PORT}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`Port ${PORT} already in use.`);
          process.exit(1);
        }
        throw err;
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}
