-- Enable UPDATE access for projects (Development Mode)
-- Required for Edit, Complete, and Archive features

create policy "Enable update access for all projects"
on public.projects for update
using (true)
with check (true);
