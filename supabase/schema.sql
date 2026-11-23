-- Memoris: run this once in Supabase → SQL Editor → New query → Run.
-- It creates 2 tables, 1 photo bucket and the access rules for the class site.

-- 1) Profiles: one row per person (id 1..20 matches the roster in src/roster.js)
create table if not exists public.profiles (
  id         int primary key check (id between 1 and 20),
  filled     boolean not null default false,
  data       jsonb   not null default '{}'::jsonb check (pg_column_size(data) < 60000),
  updated_at timestamptz not null default now()
);

-- 2) Sticky notes that classmates leave for each other
create table if not exists public.notes (
  id         bigint generated always as identity primary key,
  to_id      int  not null check (to_id between 1 and 20),
  from_id    int  not null check (from_id between 1 and 20),
  text       text not null check (char_length(text) between 1 and 300),
  color      smallint not null default 0 check (color between 0 and 4),
  created_at timestamptz not null default now()
);
create index if not exists notes_to_idx on public.notes (to_id);

-- 3) Access rules. The site has no passwords, so the public (anon) key may read and write
--    these two tables. Limits above keep the data small and well-formed.
alter table public.profiles enable row level security;
alter table public.notes    enable row level security;

drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles insert" on public.profiles for insert with check (true);
create policy "profiles update" on public.profiles for update using (true) with check (true);

drop policy if exists "notes read"   on public.notes;
drop policy if exists "notes insert" on public.notes;
drop policy if exists "notes delete" on public.notes;
create policy "notes read"   on public.notes for select using (true);
create policy "notes insert" on public.notes for insert with check (true);
create policy "notes delete" on public.notes for delete using (true);

-- 4) Photo storage: a public bucket (anyone with the link can view a photo),
--    max 3 MB per file, images only. The site shrinks photos to ~150 KB before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos upload" on storage.objects;
drop policy if exists "photos delete" on storage.objects;
create policy "photos upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "photos delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'photos');
