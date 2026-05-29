const express = require("express");
const { Pool } = require("pg");

const router = express.Router();

const RESOURCE_TYPES = new Set(["banner", "brand", "feature-icon", "deal", "popup"]);

const poolConfig = () => ({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "admin_resources" (
      "id" TEXT PRIMARY KEY DEFAULT concat('adm_', md5(random()::text || clock_timestamp()::text)),
      "type" TEXT NOT NULL,
      "title" TEXT,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "order" INTEGER NOT NULL DEFAULT 0,
      "data" JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

router.get("/resources/:type", async (req, res) => {
  if (!RESOURCE_TYPES.has(req.params.type)) {
    return res.status(400).json({ error: "Invalid resource type" });
  }

  const pool = new Pool(poolConfig());
  const client = await pool.connect();

  try {
    await ensureTable(client);
    const result = await client.query(
      `
        SELECT *
        FROM "admin_resources"
        WHERE "type" = $1 AND "enabled" = true
        ORDER BY "order" ASC, "createdAt" DESC
      `,
      [req.params.type],
    );

    res.json({ resources: result.rows });
  } catch (error) {
    console.error("Get public resources error:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  } finally {
    client.release();
    await pool.end();
  }
});

module.exports = router;
