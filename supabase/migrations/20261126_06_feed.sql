-- Stage D: posts with up to 10 photos, likes, comments with replies, saved posts.
-- Existing profile photos become each person's first post (the files are shared, never deleted through posts).
-- Rollback: supabase/rollback/2026-11-26-feed.sql

create table public.posts (
  id bigint generated always as identity primary key,
  author_id int not null check (author_id between 1 and 99),
  caption text not null default '' check (char_length(caption) <= 2200),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  legacy boolean not null default false
);
create index posts_created on public.posts (id desc);
create index posts_author on public.posts (author_id, id desc);

create table public.post_media (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  idx smallint not null check (idx between 0 and 9),
  full_url text not null check (char_length(full_url) <= 500),
  feed_url text not null check (char_length(feed_url) <= 500),
  thumb_url text not null check (char_length(thumb_url) <= 500),
  orig_url text check (orig_url is null or char_length(orig_url) <= 500),
  w int not null check (w between 1 and 20000),
  h int not null check (h between 1 and 20000),
  bytes int not null default 0,
  owns_files boolean not null default true,
  unique (post_id, idx)
);

create table public.post_likes (
  post_id bigint not null references public.posts (id) on delete cascade,
  person_id int not null,
  created_at timestamptz not null default now(),
  primary key (post_id, person_id)
);

create table public.post_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  author_id int not null check (author_id between 1 and 99),
  parent_id bigint references public.post_comments (id) on delete cascade,
  text text not null check (char_length(text) <= 1000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  check (deleted_at is not null or char_length(text) >= 1)
);
create index post_comments_post on public.post_comments (post_id, id);

create table public.comment_likes (
  comment_id bigint not null references public.post_comments (id) on delete cascade,
  person_id int not null,
  primary key (comment_id, person_id)
);

create table public.saved_posts (
  person_id int not null,
  post_id bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (person_id, post_id)
);

-- One level of replies: a reply to a reply is attached to the top comment.
create or replace function public.comments_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_parent record;
begin
  if new.parent_id is not null then
    select id, post_id, parent_id into v_parent from public.post_comments where id = new.parent_id;
    if v_parent.id is null or v_parent.post_id <> new.post_id then raise exception 'bad_parent'; end if;
    if v_parent.parent_id is not null then new.parent_id := v_parent.parent_id; end if;
  end if;
  return new;
end $$;
create trigger comments_before_insert before insert on public.post_comments for each row execute function public.comments_before_insert();

-- RLS: members read everything; each person writes only their own rows.
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.saved_posts enable row level security;
revoke all on public.posts, public.post_media, public.post_likes, public.post_comments, public.comment_likes, public.saved_posts from anon;

create policy "posts read" on public.posts for select to authenticated using ((select public.is_member()));
create policy "posts insert" on public.posts for insert to authenticated with check (author_id = (select public.my_person()) and not legacy and edited_at is null);
create policy "posts update own" on public.posts for update to authenticated using (author_id = (select public.my_person())) with check (author_id = (select public.my_person()));
create policy "posts delete" on public.posts for delete to authenticated using (author_id = (select public.my_person()) or (select public.is_admin()));
revoke update on public.posts from authenticated;
grant update (caption, edited_at) on public.posts to authenticated;

create policy "media read" on public.post_media for select to authenticated using ((select public.is_member()));
create policy "media insert" on public.post_media for insert to authenticated with check (
  owns_files and exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select public.my_person()))
  -- files must live in the author's own folder of the photos bucket
  and full_url like '%/storage/v1/object/public/photos/' || (select public.my_person()) || '/%'
  and feed_url like '%/storage/v1/object/public/photos/' || (select public.my_person()) || '/%'
  and thumb_url like '%/storage/v1/object/public/photos/' || (select public.my_person()) || '/%'
  and (orig_url is null or orig_url like '%/storage/v1/object/public/photos/' || (select public.my_person()) || '/%')
);
revoke update, delete on public.post_media from authenticated;

create policy "likes read" on public.post_likes for select to authenticated using ((select public.is_member()));
create policy "likes insert" on public.post_likes for insert to authenticated with check (person_id = (select public.my_person()));
create policy "likes delete" on public.post_likes for delete to authenticated using (person_id = (select public.my_person()));

create policy "comments read" on public.post_comments for select to authenticated using ((select public.is_member()));
create policy "comments insert" on public.post_comments for insert to authenticated
  with check (author_id = (select public.my_person()) and deleted_at is null and edited_at is null);
create policy "comments update own" on public.post_comments for update to authenticated
  using (author_id = (select public.my_person()) and deleted_at is null) with check (author_id = (select public.my_person()));
revoke update, delete on public.post_comments from authenticated;
grant update (text, edited_at) on public.post_comments to authenticated;

create policy "clikes read" on public.comment_likes for select to authenticated using ((select public.is_member()));
create policy "clikes insert" on public.comment_likes for insert to authenticated with check (person_id = (select public.my_person()));
create policy "clikes delete" on public.comment_likes for delete to authenticated using (person_id = (select public.my_person()));

create policy "saved own" on public.saved_posts for select to authenticated using (person_id = (select public.my_person()));
create policy "saved insert" on public.saved_posts for insert to authenticated with check (person_id = (select public.my_person()));
create policy "saved delete" on public.saved_posts for delete to authenticated using (person_id = (select public.my_person()));

-- Feed: newest first, with counts and my like/save, in one call. p_author / p_saved narrow it down.
create or replace function public.feed(p_before bigint default null, p_limit int default 10, p_author int default null, p_saved boolean default false, p_ids bigint[] default null)
returns table (id bigint, author_id int, caption text, created_at timestamptz, edited_at timestamptz, legacy boolean,
               media jsonb, likes int, liked boolean, comments int, saved boolean, likers int[])
language sql stable security definer set search_path = '' as $$
  with me as (select public.my_person() as p)
  select p.id, p.author_id, p.caption, p.created_at, p.edited_at, p.legacy,
    coalesce((select jsonb_agg(jsonb_build_object('full', m.full_url, 'feed', m.feed_url, 'thumb', m.thumb_url, 'orig', m.orig_url, 'w', m.w, 'h', m.h, 'own', m.owns_files) order by m.idx)
              from public.post_media m where m.post_id = p.id), '[]'::jsonb),
    (select count(*)::int from public.post_likes l where l.post_id = p.id),
    exists (select 1 from public.post_likes l where l.post_id = p.id and l.person_id = me.p),
    (select count(*)::int from public.post_comments c where c.post_id = p.id and c.deleted_at is null),
    exists (select 1 from public.saved_posts s where s.post_id = p.id and s.person_id = me.p),
    (select array_agg(l.person_id order by l.created_at desc) from (select person_id, created_at from public.post_likes l where l.post_id = p.id order by created_at desc limit 3) l)
  from public.posts p, me
  where me.p is not null
    and (p_before is null or p.id < p_before)
    and (p_author is null or p.author_id = p_author)
    and (not p_saved or exists (select 1 from public.saved_posts s where s.post_id = p.id and s.person_id = me.p))
    and (p_ids is null or p.id = any (p_ids))
  order by p.id desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
$$;

create or replace function public.delete_comment(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); c record;
begin
  select pc.id, pc.author_id, p.author_id as post_author into c from public.post_comments pc join public.posts p on p.id = pc.post_id where pc.id = p_id;
  if c.id is null then raise exception 'not_found'; end if;
  if v_me is null or (c.author_id <> v_me and c.post_author <> v_me and not public.is_admin()) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.post_comments set deleted_at = now(), text = '' where id = p_id and deleted_at is null;
  delete from public.comment_likes where comment_id = p_id;
end $$;

create or replace function public.photo_storage_used() returns bigint
language sql stable security definer set search_path = '' as $$
  select case when public.is_member() then coalesce((select sum((metadata ->> 'size')::bigint) from storage.objects), 0) else 0 end
$$;

revoke all on function public.feed(bigint, int, int, boolean, bigint[]), public.delete_comment(bigint), public.photo_storage_used(), public.comments_before_insert() from public, anon;
grant execute on function public.feed(bigint, int, int, boolean, bigint[]), public.delete_comment(bigint), public.photo_storage_used() to authenticated;

alter publication supabase_realtime add table public.posts, public.post_likes, public.post_comments;

-- Bigger files for "keep the original" (up to 10 MB); HEIC is not accepted because most browsers cannot show it.
update storage.buckets set file_size_limit = 10485760 where id = 'photos';

-- Move existing profile photos into one post per person, dated by the earliest upload.
with src as (
  select pr.id as person, ph.value as photo, ph.ordinality - 1 as idx,
         coalesce(nullif(substring(ph.value ->> 'full' from '/(\d{13})-'), '')::bigint, extract(epoch from pr.updated_at)::bigint * 1000) as ts
  from public.profiles pr, jsonb_array_elements(coalesce(pr.data -> 'photos', '[]'::jsonb)) with ordinality ph
  where pr.id between 1 and 20
), posts_new as (
  insert into public.posts (author_id, caption, created_at, legacy)
  select person, '', to_timestamp(min(ts) / 1000.0), true from src group by person order by min(ts)
  returning id, author_id
)
insert into public.post_media (post_id, idx, full_url, feed_url, thumb_url, w, h, owns_files)
select pn.id, s.idx, s.photo ->> 'full', s.photo ->> 'full', coalesce(s.photo ->> 'thumb', s.photo ->> 'full'),
       greatest(1, coalesce((s.photo ->> 'w')::int, 1200)), greatest(1, coalesce((s.photo ->> 'h')::int, 1600)), false
from src s join posts_new pn on pn.author_id = s.person
where s.idx < 10;
