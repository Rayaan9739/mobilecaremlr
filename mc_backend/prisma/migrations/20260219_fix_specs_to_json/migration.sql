-- Align products.specs storage with structured JSON payloads.
-- Converts TEXT[] -> JSONB while preserving existing data where possible.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'specs'
  ) THEN
    ALTER TABLE "products"
    ALTER COLUMN "specs" TYPE jsonb
    USING (
      CASE
        WHEN "specs" IS NULL THEN NULL
        -- If it was a text[] holding a single JSON string, use that element.
        WHEN array_length("specs", 1) = 1 THEN ("specs"[1])::jsonb
        -- Otherwise, store the whole array as JSON.
        ELSE to_jsonb("specs")
      END
    );
  ELSE
    ALTER TABLE "products"
    ADD COLUMN "specs" jsonb;
  END IF;
END $$;
