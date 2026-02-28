// Trigger restart due to EADDRINUSE fix
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("node:path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const orderRoutes = require("./routes/orders");
const addressRoutes = require("./routes/addresses");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/upload");
const devRoutes = require("./routes/dev");
const prisma = require("./utils/prisma");
const { ensureAdminExists } = require("./utils/ensureAdmin");

const app = express();
app.set("trust proxy", 1);

async function testDatabaseConnection() {
  try {
    console.log("⏳ Connecting to database...");
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timed out (5s)")), 5000)
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
  })
);

// ✅ PRODUCTION-READY CORS CONFIG
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
  "https://mobilecaremlr.vercel.app",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

console.log(`🔒 CORS configured for origins: ${allowedOrigins.join(", ")}`);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});
app.use(limiter);

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
  express.static(path.join(__dirname, "../uploads"))
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
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/admin/notifications", require("./routes/notifications"));

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
  const PORT = Number(process.env.PORT || 5006);

  init()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`🚀 API server listening on port ${PORT}`);
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