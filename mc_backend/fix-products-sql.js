const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
  connectionString,
  ssl: false
});

async function fixProducts() {
  const client = await pool.connect();
  try {
    // First, get column names
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    
    console.log("Columns in products table:");
    console.log(columns.rows.map(r => r.column_name));
    
    // Now check the data
    console.log("\nChecking data types...");
    const result = await client.query(`
      SELECT id, name, highlights, "colorVariants" 
      FROM products 
      LIMIT 3
    `);
    
    for (const row of result.rows) {
      console.log(`\nProduct: ${row.name}`);
      console.log(`  highlights type: ${typeof row.highlights}, value: ${JSON.stringify(row.highlights)?.substring(0, 200)}`);
      console.log(`  "colorVariants" type: ${typeof row.colorVariants}, value: ${JSON.stringify(row.colorVariants)?.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixProducts();
