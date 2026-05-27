const express = require("express");
const { Pool } = require("pg");
const { adminAuth } = require("../middleware/auth");

const router = express.Router();

const RESOURCE_TYPES = new Set([
  "banner",
  "brand",
  "feature-icon",
  "deal",
  "popup",
]);

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
  await client.query(
    `CREATE INDEX IF NOT EXISTS "admin_resources_type_idx" ON "admin_resources" ("type")`,
  );
}

function assertType(type, res) {
  if (!RESOURCE_TYPES.has(type)) {
    res.status(400).json({ error: "Invalid admin resource type" });
    return false;
  }
  return true;
}

router.use(adminAuth);

router.get("/:type", async (req, res) => {
  if (!assertType(req.params.type, res)) return;
  const pool = new Pool(poolConfig());
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const result = await client.query(
      `
        SELECT *
        FROM "admin_resources"
        WHERE "type" = $1
        ORDER BY "order" ASC, "createdAt" DESC
      `,
      [req.params.type],
    );
    res.json({ resources: result.rows });
  } catch (error) {
    console.error("Get admin resources error:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  } finally {
    client.release();
    await pool.end();
  }
});

router.post("/:type", async (req, res) => {
  if (!assertType(req.params.type, res)) return;
  const pool = new Pool(poolConfig());
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const { title = "", enabled = true, order = 0, data = {} } = req.body || {};
    const result = await client.query(
      `
        INSERT INTO "admin_resources" ("type", "title", "enabled", "order", "data")
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING *
      `,
      [
        req.params.type,
        String(title || ""),
        Boolean(enabled),
        Number(order) || 0,
        JSON.stringify(data || {}),
      ],
    );
    res.status(201).json({ resource: result.rows[0] });
  } catch (error) {
    console.error("Create admin resource error:", error);
    res.status(500).json({ error: "Failed to create resource" });
  } finally {
    client.release();
    await pool.end();
  }
});

router.put("/:type/:id", async (req, res) => {
  if (!assertType(req.params.type, res)) return;
  const pool = new Pool(poolConfig());
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const { title = "", enabled = true, order = 0, data = {} } = req.body || {};
    const result = await client.query(
      `
        UPDATE "admin_resources"
        SET "title" = $1,
            "enabled" = $2,
            "order" = $3,
            "data" = $4::jsonb,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $5 AND "type" = $6
        RETURNING *
      `,
      [
        String(title || ""),
        Boolean(enabled),
        Number(order) || 0,
        JSON.stringify(data || {}),
        req.params.id,
        req.params.type,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Resource not found" });
    }
    res.json({ resource: result.rows[0] });
  } catch (error) {
    console.error("Update admin resource error:", error);
    res.status(500).json({ error: "Failed to update resource" });
  } finally {
    client.release();
    await pool.end();
  }
});

router.delete("/:type/:id", async (req, res) => {
  if (!assertType(req.params.type, res)) return;
  const pool = new Pool(poolConfig());
  const client = await pool.connect();
  try {
    await ensureTable(client);
    await client.query(
      `DELETE FROM "admin_resources" WHERE "id" = $1 AND "type" = $2`,
      [req.params.id, req.params.type],
    );
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Delete admin resource error:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  } finally {
    client.release();
    await pool.end();
  }
});

module.exports = router;
