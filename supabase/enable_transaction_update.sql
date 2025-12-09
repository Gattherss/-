-- Enable UPDATE permission for transactions table
-- Run this in Supabase SQL Editor

create policy "Enable update for anonymous users"
on "public"."transactions"
for update
to anon
using (true)
with check (true);

-- Ensure projects update is also robust (redundant but safe)
create policy "Enable update for anonymous users"
on "public"."projects"
for update
to anon
using (true)
with check (true);
