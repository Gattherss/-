-- Enable delete for anon/public for transactions table
create policy "Enable delete for all users"
on "public"."transactions"
as permissive
for delete
to public
using (true);

-- Also ensure project deletion is enabled
create policy "Enable delete for all users"
on "public"."projects"
as permissive
for delete
to public
using (true);
