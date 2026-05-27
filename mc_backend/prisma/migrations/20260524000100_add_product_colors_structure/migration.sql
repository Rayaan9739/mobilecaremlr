ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "colors" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "isWeeklyTrending" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER;

UPDATE "products"
SET "colors" = COALESCE(
  NULLIF(to_jsonb("colorVariants"), '[]'::jsonb),
  '[]'::jsonb
)
WHERE "colors" = '[]'::jsonb
  AND "colorVariants" IS NOT NULL
  AND array_length("colorVariants", 1) IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'reviewsCount'
  ) THEN
    EXECUTE 'UPDATE "products" SET "reviewCount" = "reviewsCount" WHERE "reviewCount" IS NULL AND "reviewsCount" IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ratingsCount'
  ) THEN
    EXECUTE 'UPDATE "products" SET "reviewCount" = "ratingsCount" WHERE "reviewCount" IS NULL AND "ratingsCount" IS NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'isNew'
  ) THEN
    EXECUTE 'UPDATE "products" SET "isNewArrival" = COALESCE("isNew", false) WHERE "isNewArrival" = false';
  END IF;
END $$;
