-- Add category column to transactions table
ALTER TABLE "public"."transactions"
ADD COLUMN IF NOT EXISTS "category" text;

-- Common expense categories for grants
COMMENT ON COLUMN "public"."transactions"."category" IS 'Expense category: equipment, travel, personnel, supplies, services, other';
