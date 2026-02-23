-- Add PASSWORD_RESET to OTPType enum (Postgres).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'OTPType'
  ) THEN
    BEGIN
      ALTER TYPE "OTPType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
    EXCEPTION
      WHEN duplicate_object THEN
        -- already exists
        NULL;
    END;
  END IF;
END $$;

