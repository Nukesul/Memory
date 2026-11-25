-- Phase 1, step 1-2: backup everything, then add invite-based accounts. Additive: the current site keeps working.

-- 1. Backup (data + current policies + bucket settings)
create schema if not exists backup_20261126;
revoke all on schema backup_20261126 from public, anon, authenticated;
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('create table backup_20261126.%I as table public.%I', t, t);
  end loop;
end $$;
create table backup_20261126._policies as select * from pg_policies where schemaname in ('public', 'storage');
create table backup_20261126._buckets as select * from storage.buckets;
create table backup_20261126._objects as select id, bucket_id, name, owner, metadata, created_at from storage.objects;

-- 2. Accounts, admins, invites
create table public.admins (person_id int primary key);
insert into public.admins values (2);
alter table public.admins enable row level security;

create table public.accounts (
  person_id int primary key check (person_id between 1 and 999),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  disabled boolean not null default false
);
alter table public.accounts enable row level security;
create policy "accounts own" on public.accounts for select to authenticated using (user_id = (select auth.uid()));

create table public.invites (
  id bigint generated always as identity primary key,
  person_id int not null check (person_id between 1 and 999),
  kind text not null check (kind in ('join', 'reset')),
  code_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index invites_person on public.invites (person_id);
alter table public.invites enable row level security; -- no policies: only functions touch it

alter table public.presence add column if not exists visible boolean not null default true;

-- 3. Identity helpers. person_id comes from app_metadata (only the server can set it)
--    AND must match an enabled row in accounts for this auth user.
create or replace function public.my_person() returns int
language sql stable security definer set search_path = '' as $$
  select a.person_id from public.accounts a
  where a.user_id = auth.uid()
    and not a.disabled
    and a.person_id = nullif(auth.jwt() -> 'app_metadata' ->> 'person_id', '')::int
$$;
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$ select public.my_person() is not null $$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where person_id = public.my_person())
$$;

-- 4. Server-only invite functions (called by the auth-invite Edge Function with the service role)
create or replace function public.invite_lookup(p_hash text) returns table (person_id int, kind text)
language sql stable security definer set search_path = '' as $$
  select i.person_id, i.kind from public.invites i
  where i.code_hash = p_hash and i.used_at is null and i.expires_at > now()
$$;
create or replace function public.claim_invite(p_hash text, p_kind text) returns int
language sql security definer set search_path = '' as $$
  update public.invites set used_at = now()
  where code_hash = p_hash and kind = p_kind and used_at is null and expires_at > now()
  returning person_id
$$;
create or replace function public.unclaim_invite(p_hash text) returns void
language sql security definer set search_path = '' as $$
  update public.invites set used_at = null where code_hash = p_hash and expires_at > now()
$$;
create or replace function public.revoke_sessions(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  delete from auth.sessions where user_id = p_user
$$;

-- 5. Admin functions (no PIN: the database checks the signed-in admin)
create or replace function public.admin_create_invite(p_person int, p_kind text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_has boolean;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_kind not in ('join', 'reset') or p_person is null or p_person < 1 or p_person > 999 then
    raise exception 'bad_request';
  end if;
  select exists (select 1 from public.accounts where person_id = p_person) into v_has;
  if p_kind = 'join' and v_has then raise exception 'already_registered'; end if;
  if p_kind = 'reset' and not v_has then raise exception 'no_account'; end if;
  -- Only the newest link works.
  update public.invites set expires_at = now()
  where person_id = p_person and kind = p_kind and used_at is null and expires_at > now();
  v_code := translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/=', '-_');
  insert into public.invites (person_id, kind, code_hash, expires_at)
  values (p_person, p_kind, encode(sha256(convert_to(v_code, 'UTF8')), 'hex'),
          now() + case when p_kind = 'join' then interval '14 days' else interval '24 hours' end);
  return v_code;
end $$;

create or replace function public.admin_members()
returns table (person_id int, email text, registered_at timestamptz, disabled boolean, invite_kind text, invite_expires timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with ids as (select a.person_id from public.accounts a union select i.person_id from public.invites i)
  select ids.person_id, a.email, a.created_at, a.disabled, inv.kind, inv.expires_at
  from ids
  left join public.accounts a on a.person_id = ids.person_id
  left join lateral (
    select i.kind, i.expires_at from public.invites i
    where i.person_id = ids.person_id and i.used_at is null and i.expires_at > now()
    order by i.created_at desc limit 1
  ) inv on true;
end $$;

create or replace function public.admin_revoke_invites(p_person int) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.invites set expires_at = now() where person_id = p_person and used_at is null and expires_at > now();
end $$;

create or replace function public.admin_set_disabled(p_person int, p_disabled boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_person = public.my_person() then raise exception 'cannot_disable_self'; end if;
  update public.accounts set disabled = p_disabled where person_id = p_person returning user_id into v_user;
  if p_disabled and v_user is not null then delete from auth.sessions where user_id = v_user; end if;
end $$;

-- 6. Grants: nothing for anon; server-only helpers only for service_role.
revoke all on function public.my_person(), public.is_member(), public.is_admin() from public, anon;
grant execute on function public.my_person(), public.is_member(), public.is_admin() to authenticated;
revoke all on function public.invite_lookup(text), public.claim_invite(text, text), public.unclaim_invite(text), public.revoke_sessions(uuid) from public, anon, authenticated;
grant execute on function public.invite_lookup(text), public.claim_invite(text, text), public.unclaim_invite(text), public.revoke_sessions(uuid) to service_role;
revoke all on function public.admin_create_invite(int, text), public.admin_members(), public.admin_revoke_invites(int), public.admin_set_disabled(int, boolean) from public, anon;
grant execute on function public.admin_create_invite(int, text), public.admin_members(), public.admin_revoke_invites(int), public.admin_set_disabled(int, boolean) to authenticated;
revoke all on public.accounts, public.invites, public.admins from anon;
