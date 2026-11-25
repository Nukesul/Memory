-- Phase 1, step 4: only signed-in classmates see data; everyone changes only their own rows.
-- Rollback: supabase/rollback/2026-11-26-strict-rls.sql

-- 1. Drop every old open policy on class tables and on the photos bucket.
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

-- 2. Guests get nothing at all.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- 3. Capsule opening date lives in the database, so the lock is real.
create or replace function public.capsule_open_at() returns timestamptz
language sql immutable set search_path = '' as $$ select timestamptz '2037-03-15 00:00:00+09' $$;

-- 4. Policies (authenticated + linked account; my_person() is null for anyone else)
create policy "profiles read"   on public.profiles for select to authenticated using ((select public.is_member()));
create policy "profiles insert" on public.profiles for insert to authenticated
  with check (id = (select public.my_person()) or (select public.is_admin()));
create policy "profiles update" on public.profiles for update to authenticated
  using (id = (select public.my_person()) or (select public.is_admin()))
  with check (id = (select public.my_person()) or (select public.is_admin()));

create policy "notes read"   on public.notes for select to authenticated using ((select public.is_member()));
create policy "notes insert" on public.notes for insert to authenticated with check (from_id = (select public.my_person()));
create policy "notes delete" on public.notes for delete to authenticated
  using (from_id = (select public.my_person()) or to_id = (select public.my_person()) or (select public.is_admin()));

create policy "votes read"   on public.votes for select to authenticated using ((select public.is_member()));
create policy "votes insert" on public.votes for insert to authenticated with check (voter_id = (select public.my_person()));
create policy "votes update" on public.votes for update to authenticated using (voter_id = (select public.my_person())) with check (voter_id = (select public.my_person()));
create policy "votes delete" on public.votes for delete to authenticated using (voter_id = (select public.my_person()));

create policy "autographs read"   on public.autographs for select to authenticated using ((select public.is_member()));
create policy "autographs insert" on public.autographs for insert to authenticated with check (from_id = (select public.my_person()));
create policy "autographs update" on public.autographs for update to authenticated using (from_id = (select public.my_person())) with check (from_id = (select public.my_person()));
create policy "autographs delete" on public.autographs for delete to authenticated using (from_id = (select public.my_person()) or (select public.is_admin()));

create policy "daily read"   on public.daily_answers for select to authenticated using ((select public.is_member()));
create policy "daily insert" on public.daily_answers for insert to authenticated with check (person_id = (select public.my_person()));
create policy "daily update" on public.daily_answers for update to authenticated using (person_id = (select public.my_person())) with check (person_id = (select public.my_person()));
create policy "daily delete" on public.daily_answers for delete to authenticated using (person_id = (select public.my_person()));

create policy "presence read"   on public.presence for select to authenticated
  using ((select public.is_member()) and (visible or person_id = (select public.my_person())));
create policy "presence insert" on public.presence for insert to authenticated with check (person_id = (select public.my_person()));
create policy "presence update" on public.presence for update to authenticated using (person_id = (select public.my_person())) with check (person_id = (select public.my_person()));

create policy "announcements read" on public.announcements for select to authenticated using ((select public.is_member()));

-- Messages: the class room for every member, a private message only for its two people.
create policy "messages read" on public.messages for select to authenticated
  using ((select public.is_member()) and (to_id is null or from_id = (select public.my_person()) or to_id = (select public.my_person())));
create policy "messages insert" on public.messages for insert to authenticated
  with check (from_id = (select public.my_person()) and reactions = '{}'::jsonb and edited_at is null);
create policy "messages update" on public.messages for update to authenticated
  using (from_id = (select public.my_person())) with check (from_id = (select public.my_person()));
create policy "messages delete" on public.messages for delete to authenticated
  using (from_id = (select public.my_person()) or (select public.is_admin()));
-- Authors may change only the text; reactions go through react_message().
revoke update on public.messages from authenticated;
grant update (text, edited_at) on public.messages to authenticated;

-- Capsule letters: only the author reads theirs until the opening date; nobody writes after it.
create policy "capsules read" on public.capsules for select to authenticated
  using (author_id = (select public.my_person()) or ((select public.is_member()) and now() >= public.capsule_open_at()));
create policy "capsules insert" on public.capsules for insert to authenticated
  with check (author_id = (select public.my_person()) and now() < public.capsule_open_at());
create policy "capsules update" on public.capsules for update to authenticated
  using (author_id = (select public.my_person()) and now() < public.capsule_open_at())
  with check (author_id = (select public.my_person()));
create policy "capsules delete" on public.capsules for delete to authenticated
  using (author_id = (select public.my_person()) and now() < public.capsule_open_at());

-- 5. Length limits for new rows (NOT VALID: existing rows are left as they are).
alter table public.notes add constraint notes_text_len check (char_length(text) between 1 and 300) not valid;
alter table public.messages add constraint messages_text_len check (char_length(text) between 1 and 500) not valid;
alter table public.daily_answers add constraint daily_text_len check (text is null or char_length(text) <= 200) not valid;
alter table public.capsules add constraint capsules_text_len check (char_length(text) <= 1200) not valid;
alter table public.autographs add constraint autographs_ink_len check (pg_column_size(ink) <= 20000) not valid;
alter table public.profiles add constraint profiles_data_len check (pg_column_size(data) <= 40000) not valid;

-- 6. Photos: private bucket; read for members, write only inside your own folder "<person_id>/".
update storage.buckets set public = false where id = 'photos';
create policy "photos read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (select public.is_member()));
create policy "photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select public.my_person())::text);
create policy "photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = (select public.my_person())::text or (select public.is_admin())));

-- 7. Functions that replace direct writes.
create or replace function public.react_message(p_id bigint, p_emoji text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_me int := public.my_person();
  v_r jsonb;
  v_list jsonb;
begin
  if v_me is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_emoji is null or char_length(p_emoji) > 16 or p_emoji = '' then raise exception 'bad_request'; end if;
  select reactions into v_r from public.messages
  where id = p_id and (to_id is null or from_id = v_me or to_id = v_me) for update;
  if not found then raise exception 'not_found'; end if;
  v_list := coalesce(v_r -> p_emoji, '[]'::jsonb);
  if v_list @> to_jsonb(v_me) then
    v_list := (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(v_list) x where x <> to_jsonb(v_me));
  else
    v_list := v_list || to_jsonb(v_me);
  end if;
  v_r := case when jsonb_array_length(v_list) = 0 then coalesce(v_r, '{}'::jsonb) - p_emoji
              else jsonb_set(coalesce(v_r, '{}'::jsonb), array[p_emoji], v_list) end;
  update public.messages set reactions = v_r where id = p_id;
  return v_r;
end $$;

create or replace function public.capsule_meta() returns table (author_id int, updated_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_member() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select c.author_id, c.updated_at from public.capsules c order by c.updated_at;
end $$;

-- Admin: no PIN any more; the signed-in account must be an admin.
drop function if exists public.admin_check(text);
drop function if exists public.admin_post(text, text);
drop function if exists public.admin_remove_announcement(text, bigint);
drop function if exists public.admin_change_pin(text, text);
drop function if exists public.admin_stats(text);
drop function if exists public._admin_ok(text);
drop table if exists public.admin_secret;

create or replace function public.admin_post(p_text text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_text, ''))) = 0 then raise exception 'bad_request'; end if;
  insert into public.announcements (text) values (left(trim(p_text), 300));
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.admin_remove_announcement(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from public.announcements where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'ok', true,
    'profiles', (select count(*) from public.profiles),
    'filled', (select count(*) from public.profiles where filled),
    'notes', (select count(*) from public.notes),
    'messages', (select count(*) from public.messages),
    'votes', (select count(*) from public.votes),
    'autographs', (select count(*) from public.autographs),
    'capsules', (select count(*) from public.capsules),
    'accounts', (select count(*) from public.accounts),
    'photo_files', (select count(*) from storage.objects where bucket_id = 'photos'),
    'photo_bytes', (select coalesce(sum((metadata ->> 'size')::bigint), 0) from storage.objects where bucket_id = 'photos'),
    'db_bytes', pg_database_size(current_database())
  );
end $$;

-- Push subscriptions are always stored for the signed-in person, never for a person named by the browser.
drop function if exists public.save_push_sub(integer, text, text, text, text, jsonb);
create or replace function public.save_push_sub(p_endpoint text, p_p256dh text, p_auth text, p_lang text, p_prefs jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person();
begin
  if v_me is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(p_endpoint, '') !~ '^https://' or char_length(p_endpoint) > 1000 then raise exception 'bad_request'; end if;
  insert into public.push_subs (endpoint, person_id, p256dh, auth, lang, prefs)
  values (p_endpoint, v_me, p_p256dh, p_auth, coalesce(p_lang, 'en'),
          coalesce(p_prefs, '{"dm":true,"class":true,"notes":true,"news":true,"daily":true}'::jsonb))
  on conflict (endpoint) do update
    set person_id = excluded.person_id, p256dh = excluded.p256dh, auth = excluded.auth,
        lang = excluded.lang, prefs = excluded.prefs, updated_at = now();
end $$;
create or replace function public.update_push_prefs(p_endpoint text, p_lang text, p_prefs jsonb) returns void
language sql security definer set search_path = '' as $$
  update public.push_subs set prefs = coalesce(p_prefs, prefs), lang = coalesce(p_lang, lang), updated_at = now()
  where endpoint = p_endpoint and person_id = public.my_person();
$$;
create or replace function public.remove_push_sub(p_endpoint text) returns void
language sql security definer set search_path = '' as $$
  delete from public.push_subs where endpoint = p_endpoint and person_id = public.my_person();
$$;

-- 8. Who may call what.
revoke all on function public.react_message(bigint, text), public.capsule_meta(), public.admin_post(text),
  public.admin_remove_announcement(bigint), public.admin_stats(), public.save_push_sub(text, text, text, text, jsonb),
  public.update_push_prefs(text, text, jsonb), public.remove_push_sub(text) from public, anon;
grant execute on function public.react_message(bigint, text), public.capsule_meta(), public.admin_post(text),
  public.admin_remove_announcement(bigint), public.admin_stats(), public.save_push_sub(text, text, text, text, jsonb),
  public.update_push_prefs(text, text, jsonb), public.remove_push_sub(text) to authenticated;
revoke all on function public.notify_push(), public.notify_scheduled(text) from public, anon, authenticated;
