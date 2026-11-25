-- ROLLBACK for 20261126_02_strict_rls.sql. Restores the open (pre-auth) policies and the public bucket.
-- Data is never deleted by the forward migration; a full copy also lives in schema backup_20261126.
-- After running this, redeploy the previous site build: git -C gh-pages checkout aa9cd5f -- . && push.
begin;
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where (schemaname = 'public' and tablename in ('announcements','autographs','capsules','daily_answers','messages','notes','presence','profiles','votes'))
              or (schemaname = 'storage' and tablename = 'objects' and policyname like 'photos%')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;
create policy "announcements read" on public.announcements for select to anon, authenticated using (true);
create policy "autographs delete" on public.autographs for delete to anon, authenticated using (true);
create policy "autographs insert" on public.autographs for insert to anon, authenticated with check (true);
create policy "autographs read" on public.autographs for select to anon, authenticated using (true);
create policy "autographs update" on public.autographs for update to anon, authenticated using (true) with check (true);
create policy "capsules delete" on public.capsules for delete to anon, authenticated using (true);
create policy "capsules insert" on public.capsules for insert to anon, authenticated with check (true);
create policy "capsules read" on public.capsules for select to anon, authenticated using (true);
create policy "capsules update" on public.capsules for update to anon, authenticated using (true) with check (true);
create policy "daily delete" on public.daily_answers for delete to anon, authenticated using (true);
create policy "daily insert" on public.daily_answers for insert to anon, authenticated with check (true);
create policy "daily read" on public.daily_answers for select to anon, authenticated using (true);
create policy "daily update" on public.daily_answers for update to anon, authenticated using (true) with check (true);
create policy "messages delete" on public.messages for delete to anon, authenticated using (true);
create policy "messages insert" on public.messages for insert to anon, authenticated with check (true);
create policy "messages read" on public.messages for select to anon, authenticated using (true);
create policy "messages update" on public.messages for update to anon, authenticated using (true) with check (true);
create policy "notes delete" on public.notes for delete to public using (true);
create policy "notes insert" on public.notes for insert to public with check (true);
create policy "notes read" on public.notes for select to public using (true);
create policy "presence insert" on public.presence for insert to anon, authenticated with check (true);
create policy "presence read" on public.presence for select to anon, authenticated using (true);
create policy "presence update" on public.presence for update to anon, authenticated using (true) with check (true);
create policy "profiles insert" on public.profiles for insert to public with check (true);
create policy "profiles read" on public.profiles for select to public using (true);
create policy "profiles update" on public.profiles for update to public using (true) with check (true);
create policy "votes delete" on public.votes for delete to anon, authenticated using (true);
create policy "votes insert" on public.votes for insert to anon, authenticated with check (true);
create policy "votes read" on public.votes for select to anon, authenticated using (true);
create policy "votes update" on public.votes for update to anon, authenticated using (true) with check (true);
create policy "photos delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'photos');
create policy "photos upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'photos');
update storage.buckets set public = true where id = 'photos';
grant select, insert, update, delete on all tables in schema public to anon;
grant update on public.messages to authenticated;
-- The old PIN-based admin functions are not recreated; restore them from git history (supabase/schema.sql) if needed.
commit;
