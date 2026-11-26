-- Stage D hardening: post photos must be files of this project, in the author's own "<person>/p/" folder.
-- Rollback: re-create the policy from 20261126_06_feed.sql.
drop policy if exists "media insert" on public.post_media;
create policy "media insert" on public.post_media for insert to authenticated with check (
  owns_files and exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select public.my_person()))
  and full_url like 'https://pifzkxxnpxughaeezzuu.supabase.co/storage/v1/object/public/photos/' || (select public.my_person()) || '/p/%'
  and feed_url like 'https://pifzkxxnpxughaeezzuu.supabase.co/storage/v1/object/public/photos/' || (select public.my_person()) || '/p/%'
  and thumb_url like 'https://pifzkxxnpxughaeezzuu.supabase.co/storage/v1/object/public/photos/' || (select public.my_person()) || '/p/%'
  and (orig_url is null or orig_url like 'https://pifzkxxnpxughaeezzuu.supabase.co/storage/v1/object/public/photos/' || (select public.my_person()) || '/p/%')
  and position('..' in full_url || feed_url || thumb_url || coalesce(orig_url, '')) = 0
);
revoke execute on function public.comments_before_insert() from authenticated;
