const prisma = require("../src/utils/prisma");

async function test() {
  try {
    const products = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });
    console.log("Products:", products.length);
  } catch (err) {
    console.error("product.findMany error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
