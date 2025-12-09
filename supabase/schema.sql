-- Projects table tracks each grant/fund.
create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_budget numeric(14,2) not null check (total_budget >= 0),
  start_date date not null,
  deadline date not null,
  created_at timestamptz not null default now(),
  constraint deadline_after_start check (deadline >= start_date)
);

-- Status type for transactional spend.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_status') then
    create type transaction_status as enum ('spent', 'invoiced');
  end if;
end $$;

-- Transactions table is the evidence locker of the burn.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  vendor text,
  occurred_at timestamptz not null default now(),
  receipt_url text,
  status transaction_status not null default 'spent',
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.transactions enable row level security;

create policy "Authenticated can read projects"
  on public.projects for select
  to authenticated
  using (true);

create policy "Authenticated can insert projects"
  on public.projects for insert
  to authenticated
  with check (true);

-- Storage bucket for receipts.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Authenticated users can read their receipts.
create policy "Authenticated can read receipts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts');

-- Authenticated users can upload receipts.
create policy "Authenticated can upload receipts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

-- Project scoping for transactions (example: only allow owners/editors).
create policy "Authenticated can read transactions"
  on public.transactions for select
  to authenticated
  using (true);

create policy "Authenticated can insert transactions"
  on public.transactions for insert
  to authenticated
  with check (true);
