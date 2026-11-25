-- ROLLBACK for 20261126_05_messenger.sql (returns to the to_id-based chat; messages written since stay, groups are lost).
begin;
drop policy if exists "conv channel read" on realtime.messages;
drop policy if exists "conv channel write" on realtime.messages;
drop policy if exists "chat read" on storage.objects;
drop policy if exists "chat upload" on storage.objects;
drop policy if exists "chat delete own" on storage.objects;
alter publication supabase_realtime drop table public.conversation_members, public.conversations;
drop trigger if exists messages_before_insert on public.messages;
drop trigger if exists messages_after_insert on public.messages;
drop policy if exists "messages read" on public.messages;
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages update own" on public.messages;
delete from public.messages where kind = 'system' or conversation_id in (select id from public.conversations where kind = 'group');
update public.messages set text = '[deleted]' where deleted_at is not null and text = '';
alter table public.messages drop constraint if exists messages_text_ok;
alter table public.messages drop column conversation_id, drop column kind, drop column attachments, drop column client_id,
  drop column forwarded_from, drop column pinned_at, drop column pinned_by, drop column deleted_at;
drop table public.conversation_members;
drop table public.conversations;
create policy "messages read" on public.messages for select to authenticated
  using ((select public.is_member()) and (to_id is null or from_id = (select public.my_person()) or to_id = (select public.my_person())));
create policy "messages insert" on public.messages for insert to authenticated
  with check (from_id = (select public.my_person()) and reactions = '{}'::jsonb and edited_at is null);
create policy "messages update" on public.messages for update to authenticated
  using (from_id = (select public.my_person())) with check (from_id = (select public.my_person()));
create policy "messages delete" on public.messages for delete to authenticated
  using (from_id = (select public.my_person()) or (select public.is_admin()));
grant insert, delete on public.messages to authenticated;
-- Functions added by the migration can stay; they are unused afterwards.
commit;
