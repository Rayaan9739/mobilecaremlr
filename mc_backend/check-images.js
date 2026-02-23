const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImages() {
  try {
    const products = await prisma.product.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        images: true
      }
    });
    
    console.log('Products in database:');
    console.log(JSON.stringify(products, null, 2));
    
    const count = await prisma.product.count();
    console.log(`\nTotal products: ${count}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
