const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        fullName: true,
        phone: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

const adminAuth = async (req, res, next) => {
  auth(req, res, () => {
    // ensure user is admin role and also the approved admin email
    const isAdminRole =
      req.user.role && req.user.role.toUpperCase() === "ADMIN";
    const isSuperEmail =
      req.user.email && req.user.email.toLowerCase() === "admin@mobilecare.com";

    if (!isAdminRole || !isSuperEmail) {
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }
    next();
  });
};

module.exports = { auth, adminAuth };
