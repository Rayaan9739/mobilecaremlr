CREATE TABLE IF NOT EXISTS "admin_resources" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "data" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "admin_resources_type_idx" ON "admin_resources" ("type");
