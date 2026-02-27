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

// Test database connection
// Test database connection
async function testDatabaseConnection() {
  try {
    console.log("⏳ Connecting to database...");
    // Add a race with timeout
    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Database connection timed out (5s)")),
        5000,
      ),
    );

    await Promise.race([prisma.$connect(), timeout]);

    console.log("✅ Database connected successfully");

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Database stats: ${userCount} users`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("   - Check internet connection");
    console.error("   - Check DATABASE_URL in .env");
    // Do NOT exit, maybe we can start server to show a health check error?
    // But for this app, it needs DB. Let's just log clearly.
    // We will throw so startServer catches it.
    throw error;
  }
}

// Security middleware - configure helmet to allow cross-origin images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS configuration - explicitly allow frontend origin
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
console.log(`🔒 CORS configured for origins: ${allowedOrigins.join(", ")}`);

// Rate limiting - increased limits to prevent 429 errors
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased from 100)
});
app.use(limiter);

// OTP rate limiting - increased for better UX
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 OTP requests per windowMs (increased from 5)
  message: "Too many OTP requests, please try again later",
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with CORS headers
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
// notifications endpoints (public creation and admin actions)
app.use("/api/notifications", require("./routes/notifications"));
// also expose admin-specific path for fetching/deleting
app.use("/api/admin/notifications", require("./routes/notifications"));

// Health check with database status
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
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
  // default to 5006 so we don't clash with any other services;
  // override with PORT env if necessary (e.g. 5000 in production)
  const PORT = Number(process.env.PORT || 5006);

  init()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`🚀 API server listening on http://localhost:${PORT}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `Port ${PORT} already in use. Did you start another instance?`,
          );
          process.exit(1);
        }
        // rethrow other errors
        throw err;
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}
