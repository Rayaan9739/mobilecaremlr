const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
  connectionString,
  ssl: false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function isValidJSON(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'object') return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

async function fixProducts() {
  try {
    console.log("Fetching all products...");
    const products = await prisma.product.findMany();
    console.log(`Found ${products.length} products`);
    
    let fixed = 0;
    for (const product of products) {
      let needsUpdate = false;
      const updateData = {};
      
      // Check and fix highlights
      if (!isValidJSON(product.highlights)) {
        console.log(`Product ${product.id}: fixing highlights (currently: ${product.highlights})`);
        updateData.highlights = {};
        needsUpdate = true;
      }
      
      // Check and fix colorVariants
      if (!isValidJSON(product.colorVariants)) {
        console.log(`Product ${product.id}: fixing colorVariants (currently: ${product.colorVariants})`);
        updateData.colorVariants = [];
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await prisma.product.update({
          where: { id: product.id },
          data: updateData
        });
        fixed++;
      }
    }
    
    console.log(`\nFixed ${fixed} products`);
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixProducts();
