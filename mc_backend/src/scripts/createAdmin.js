const prisma = require("../utils/prisma");
const bcrypt = require("../utils/bcrypt");

async function createAdmin() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      console.log("✅ Admin already exists:", existingAdmin.email);
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: {
        fullName: "Admin User",
        email: "admin@mobilecare.com",
        phone: "1234567890",
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
        phoneVerified: true,
      },
    });

    console.log("✅ Admin created successfully:");
    console.log("   Email: admin@mobilecare.com");
    console.log("   Password: admin123");
    console.log("   Role: ADMIN");
  } catch (error) {
    console.error("❌ Failed to create admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
createAdmin();
