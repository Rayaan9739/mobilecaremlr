const bcrypt = require("./bcrypt");
const prisma = require("./prisma");

async function ensureAdminExists() {
  try {
    const adminEmail = "admin@mobilecare.com";
    const adminPassword = "admin123";

    const existingByEmail = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existingByEmail) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: "ADMIN",
          password: hashedPassword,
          emailVerified: true,
          phoneVerified: true,
        },
      });

      console.log("✅ Admin user ensured:");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log("   Role: ADMIN");
      return;
    }

    await prisma.user.create({
      data: {
        fullName: "Admin User",
        email: adminEmail,
        // Avoid collisions with existing user phone unique constraint
        phone: `admin-${Date.now()}`,
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
        phoneVerified: true,
      },
    });

    console.log("✅ Default admin created:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("   Role: ADMIN");
  } catch (error) {
    console.error("❌ Failed to ensure admin exists:", error.message);
  }
}

module.exports = { ensureAdminExists };
