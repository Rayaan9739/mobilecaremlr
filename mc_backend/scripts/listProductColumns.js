const prisma = require("../src/utils/prisma");

async function listColumns() {
  try {
    const cols =
      await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position`;
    console.log(cols);
  } catch (err) {
    console.error("Error listing columns:", err);
  } finally {
    await prisma.$disconnect();
  }
}

listColumns();
