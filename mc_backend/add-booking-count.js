const { Pool } = require("pg");
require("dotenv").config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  const client = await pool.connect();
  try {
    // Add bookingCount column if it doesn't already exist
    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS "bookingCount" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('✅ bookingCount column added (or already existed) successfully.');
  } catch (err) {
    console.error('❌ Error adding column:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
