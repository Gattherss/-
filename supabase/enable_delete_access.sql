-- Enable DELETE access for all (Development Mode)

create policy "Enable delete access for all transactions"
on public.transactions for delete
using (true);

create policy "Enable delete access for all projects"
on public.projects for delete
using (true);
