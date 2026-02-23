-- Add addresses and order location snapshot fields.
-- Safe to re-run: uses IF NOT EXISTS patterns/guards where possible.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'addresses'
  ) THEN
    CREATE TABLE "addresses" (
      "id" text NOT NULL,
      "userId" text NOT NULL,
      "label" text,
      "addressText" text NOT NULL,
      "latitude" double precision,
      "longitude" double precision,
      "isDefault" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) NOT NULL,
      CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
    );

    CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");
  END IF;

  -- Foreign key to users (add only if missing)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'addresses'
      AND constraint_name = 'addresses_userId_fkey'
  ) THEN
    ALTER TABLE "addresses"
    ADD CONSTRAINT "addresses_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  -- Orders: add optional address snapshot fields
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'addressId'
  ) THEN
    ALTER TABLE "orders" ADD COLUMN "addressId" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'addressText'
  ) THEN
    ALTER TABLE "orders" ADD COLUMN "addressText" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'latitude'
  ) THEN
    ALTER TABLE "orders" ADD COLUMN "latitude" double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'longitude'
  ) THEN
    ALTER TABLE "orders" ADD COLUMN "longitude" double precision;
  END IF;

  -- FK orders.addressId -> addresses.id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'orders'
      AND constraint_name = 'orders_addressId_fkey'
  ) THEN
    ALTER TABLE "orders"
    ADD CONSTRAINT "orders_addressId_fkey"
    FOREIGN KEY ("addressId") REFERENCES "addresses"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

