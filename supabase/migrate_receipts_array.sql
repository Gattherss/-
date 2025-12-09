-- Migration: Convert single receipt_url to receipt_urls array
-- Run this in Supabase SQL Editor

-- 1. Add new column
alter table "public"."transactions" 
add column if not exists "receipt_urls" text[];

-- 2. Migrate existing data
-- If receipt_url exists, put it as the first item in the new array
update "public"."transactions"
set "receipt_urls" = ARRAY["receipt_url"]
where "receipt_url" is not null and "receipt_urls" is null;

-- 3. (Optional) Drop old column?
-- For safety, we keep it for now, but application will stop writing to it.
-- alter table "public"."transactions" drop column "receipt_url";
