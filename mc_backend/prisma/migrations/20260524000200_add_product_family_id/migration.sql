ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "familyId" TEXT;

CREATE INDEX IF NOT EXISTS "products_familyId_idx" ON "products"("familyId");
