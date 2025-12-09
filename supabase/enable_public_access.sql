-- DANGER: This allows ANYONE to read/write your data.
-- Use this only for development/testing if you haven't implemented Login yet.

-- 1. Drop existing strict policies
drop policy if exists "Authenticated can read projects" on public.projects;
drop policy if exists "Authenticated can insert projects" on public.projects;
drop policy if exists "Authenticated can read transactions" on public.transactions;
drop policy if exists "Authenticated can insert transactions" on public.transactions;

-- 2. Create permissive policies (Authenticated OR Anonymous)
create policy "Enable read access for all"
on public.projects for select
using (true);

create policy "Enable insert access for all"
on public.projects for insert
with check (true);

create policy "Enable read access for all transactions"
on public.transactions for select
using (true);

create policy "Enable insert access for all transactions"
on public.transactions for insert
with check (true);
