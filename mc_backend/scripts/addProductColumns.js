const prisma = require("../src/utils/prisma");

async function addColumns() {
  try {
    console.log("Adding missing columns to products table (if not exists)...");
    await prisma.$executeRaw`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "originalPrice" double precision;`;
    await prisma.$executeRaw`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "discount" double precision;`;
    console.log("Done.");
  } catch (err) {
    console.error("Failed to add columns:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();
