-- Force Enable Storage Permissions for 'receipts'
-- Run this in Supabase SQL Editor

-- 1. Enable RLS (required to have policies)
alter table storage.objects enable row level security;

-- 2. Create bucket if missing
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;

-- 3. Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Give anon insert access" on storage.objects;
drop policy if exists "Give anon select access" on storage.objects;

-- 4. Create a comprehensive permissive policy
-- This allows anyone (anon) to Select, Insert, Update, Delete in the receipts bucket
create policy "Allow All Access to Receipts"
on storage.objects for all
using ( bucket_id = 'receipts' )
with check ( bucket_id = 'receipts' );
