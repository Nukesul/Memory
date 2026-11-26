-- ROLLBACK for 20261126_06_feed.sql. Profile photos were only copied by reference, so nothing is lost there.
-- Photos uploaded for new posts stay in storage (folder "<person>/p/") and can be removed by hand.
begin;
alter publication supabase_realtime drop table public.posts, public.post_likes, public.post_comments;
drop table if exists public.saved_posts, public.comment_likes, public.post_comments, public.post_likes, public.post_media, public.posts cascade;
drop function if exists public.feed(bigint, int, int, boolean, bigint[]);
drop function if exists public.delete_comment(bigint);
drop function if exists public.photo_storage_used();
drop function if exists public.comments_before_insert();
update storage.buckets set file_size_limit = 3145728 where id = 'photos';
commit;
