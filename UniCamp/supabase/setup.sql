-- Run this only if chat attachments are not already set up.
-- The normal database tables do not use RLS.

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "UniCamp chat uploads" on storage.objects;

create policy "UniCamp chat uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'chat-attachments');

-- Realtime for chat messages.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then
  null;
end $$;
