-- AddColumn for product variants tracking
ALTER TABLE "products" ADD COLUMN "baseProductId" TEXT;
ALTER TABLE "products" ADD COLUMN "colorName" TEXT;
ALTER TABLE "products" ADD COLUMN "colorHex" TEXT;
ALTER TABLE "products" ADD COLUMN "storageOption" TEXT;

-- Create an index for faster variant lookups
CREATE INDEX "idx_products_baseProductId" ON "products"("baseProductId");
CREATE INDEX "idx_products_colorName" ON "products"("colorName");
CREATE INDEX "idx_products_storageOption" ON "products"("storageOption");
