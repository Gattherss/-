-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Create 'receipts' bucket if not exists
insert into storage.buckets (id, name, public) 
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Allow public access to 'receipts' bucket
create policy "Public Access"
on storage.objects for all
using ( bucket_id = 'receipts' )
with check ( bucket_id = 'receipts' );
