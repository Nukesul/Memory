-- Stage C: conversations (class, direct, group), membership, read state, richer messages, private chat media.
-- Existing messages are kept and attached to conversations. Rollback: supabase/rollback/2026-11-26-messenger.sql
-- A BEFORE INSERT trigger keeps old clients working (they still send to_id) until every device has the new app.

-- 0. Backup
create schema if not exists backup_c_20261126;
revoke all on schema backup_c_20261126 from public, anon, authenticated;
create table backup_c_20261126.messages as table public.messages;
create table backup_c_20261126.policies as select * from pg_policies where schemaname = 'public' and tablename = 'messages';

-- 1. Tables
create table public.conversations (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('class', 'direct', 'group')),
  title text check (title is null or char_length(title) between 1 and 60),
  avatar text check (avatar is null or char_length(avatar) <= 500),
  direct_key text unique,
  created_by int,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create unique index conversations_one_class on public.conversations ((true)) where kind = 'class';

create table public.conversation_members (
  conversation_id bigint not null references public.conversations (id) on delete cascade,
  person_id int not null check (person_id between 1 and 99),
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  last_read_id bigint not null default 0,
  pinned boolean not null default false,
  muted boolean not null default false,
  primary key (conversation_id, person_id)
);
create index conversation_members_person on public.conversation_members (person_id);

alter table public.messages
  add column conversation_id bigint references public.conversations (id) on delete cascade,
  add column kind text not null default 'text' check (kind in ('text', 'photo', 'voice', 'system', 'post', 'story_reply')),
  add column attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 10),
  add column client_id uuid unique,
  add column forwarded_from bigint references public.messages (id) on delete set null,
  add column pinned_at timestamptz,
  add column pinned_by int,
  add column deleted_at timestamptz;

-- Text may be empty for photos and voice notes; 2000 characters max.
alter table public.messages drop constraint if exists messages_text_check;
alter table public.messages drop constraint if exists messages_text_len;
alter table public.messages add constraint messages_text_ok check (
  char_length(text) <= 2000 and (deleted_at is not null or kind <> 'text' or char_length(text) >= 1)
);
alter table public.messages drop constraint if exists messages_from_id_check;
alter table public.messages add constraint messages_from_id_check check (from_id between 1 and 99);
alter table public.messages drop constraint if exists messages_to_id_check;
alter table public.messages add constraint messages_to_id_check check (to_id between 1 and 99);

-- 2. Backfill: one class conversation, one direct conversation per pair, everyone in the class room.
insert into public.conversations (kind, title, created_by) values ('class', null, 2);
insert into public.conversation_members (conversation_id, person_id, role)
select (select id from public.conversations where kind = 'class'), g, case when g = 2 then 'owner' else 'member' end
from generate_series(1, 20) g;

insert into public.conversations (kind, direct_key, created_by, created_at)
select 'direct', least(from_id, to_id) || ':' || greatest(from_id, to_id), min(from_id), min(created_at)
from public.messages where to_id is not null
group by least(from_id, to_id), greatest(from_id, to_id);

insert into public.conversation_members (conversation_id, person_id, joined_at)
select c.id, split_part(c.direct_key, ':', n)::int, c.created_at
from public.conversations c cross join (values (1), (2)) v(n) where c.kind = 'direct';

update public.messages m set conversation_id = case
  when m.to_id is null then (select id from public.conversations where kind = 'class')
  else (select id from public.conversations c where c.direct_key = least(m.from_id, m.to_id) || ':' || greatest(m.from_id, m.to_id))
end;
alter table public.messages alter column conversation_id set not null;
create index messages_conv_id on public.messages (conversation_id, id desc);

update public.conversations c set last_message_at = coalesce((select max(created_at) from public.messages m where m.conversation_id = c.id), c.created_at);

-- Everyone starts with what they had already seen as read (nothing to catch up on after the move).
update public.conversation_members cm set last_read_id = coalesce((select max(id) from public.messages m where m.conversation_id = cm.conversation_id), 0);

-- 3. Helpers
create or replace function public.is_conv_member(p_conv bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversation_members where conversation_id = p_conv and person_id = public.my_person())
$$;
create or replace function public.conv_role(p_conv bigint) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.conversation_members where conversation_id = p_conv and person_id = public.my_person()
$$;

-- Fill conversation_id for old clients (to_id), to_id for new direct messages, and bump the conversation.
create or replace function public.messages_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_kind text; v_other int;
begin
  if new.conversation_id is null then
    if new.to_id is null then
      select id into new.conversation_id from public.conversations where kind = 'class';
    else
      new.conversation_id := public.direct_conversation(new.from_id, new.to_id);
    end if;
  end if;
  select kind into v_kind from public.conversations where id = new.conversation_id;
  if v_kind = 'direct' and new.to_id is null then
    select person_id into v_other from public.conversation_members where conversation_id = new.conversation_id and person_id <> new.from_id limit 1;
    new.to_id := v_other;
  end if;
  return new;
end $$;

create or replace function public.messages_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  -- Sending a message means I have read everything before it.
  update public.conversation_members set last_read_id = greatest(last_read_id, new.id)
  where conversation_id = new.conversation_id and person_id = new.from_id;
  return new;
end $$;

-- Find or create the direct conversation of two people (server side only; the RPC below checks the caller).
create or replace function public.direct_conversation(p_a int, p_b int) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_key text := least(p_a, p_b) || ':' || greatest(p_a, p_b); v_id bigint;
begin
  select id into v_id from public.conversations where direct_key = v_key;
  if v_id is null then
    insert into public.conversations (kind, direct_key, created_by) values ('direct', v_key, p_a)
    on conflict (direct_key) do nothing returning id into v_id;
    if v_id is null then select id into v_id from public.conversations where direct_key = v_key; end if;
    insert into public.conversation_members (conversation_id, person_id) values (v_id, p_a), (v_id, p_b) on conflict do nothing;
  end if;
  return v_id;
end $$;

drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert before insert on public.messages for each row execute function public.messages_before_insert();
drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages for each row execute function public.messages_after_insert();

-- 4. RLS
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
revoke all on public.conversations, public.conversation_members from anon;

create policy "conversations read" on public.conversations for select to authenticated using (public.is_conv_member(id));

create policy "members read" on public.conversation_members for select to authenticated using (public.is_conv_member(conversation_id));
create policy "members update own" on public.conversation_members for update to authenticated
  using (person_id = (select public.my_person())) with check (person_id = (select public.my_person()));
revoke insert, update, delete on public.conversation_members from authenticated;
grant update (last_read_id, pinned, muted) on public.conversation_members to authenticated;
revoke insert, update, delete on public.conversations from authenticated;

drop policy if exists "messages read" on public.messages;
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages update" on public.messages;
drop policy if exists "messages delete" on public.messages;
create policy "messages read" on public.messages for select to authenticated using (public.is_conv_member(conversation_id));
create policy "messages insert" on public.messages for insert to authenticated with check (
  from_id = (select public.my_person())
  and reactions = '{}'::jsonb and edited_at is null and deleted_at is null and pinned_at is null
  and kind in ('text', 'photo', 'voice', 'post', 'story_reply')
  and public.is_conv_member(conversation_id)
);
create policy "messages update own" on public.messages for update to authenticated
  using (from_id = (select public.my_person()) and deleted_at is null)
  with check (from_id = (select public.my_person()));
-- Deleting is a soft delete through delete_message(); no direct deletes from the app.
revoke delete on public.messages from authenticated;
revoke update on public.messages from authenticated;
grant update (text, edited_at) on public.messages to authenticated;
revoke insert on public.messages from authenticated;
grant insert (conversation_id, from_id, to_id, text, kind, attachments, client_id, reply_to, forwarded_from) on public.messages to authenticated;

-- 5. RPCs
create or replace function public.open_direct(p_other int) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person();
begin
  if v_me is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_other is null or p_other = v_me or p_other not between 1 and 99 then raise exception 'bad_request'; end if;
  return public.direct_conversation(v_me, p_other);
end $$;

create or replace function public.create_group(p_title text, p_members int[]) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); v_id bigint; v_title text := nullif(trim(coalesce(p_title, '')), '');
begin
  if v_me is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_title is null or char_length(v_title) > 60 then raise exception 'bad_title'; end if;
  if coalesce(array_length(p_members, 1), 0) < 1 or array_length(p_members, 1) > 98 then raise exception 'bad_members'; end if;
  insert into public.conversations (kind, title, created_by) values ('group', v_title, v_me) returning id into v_id;
  insert into public.conversation_members (conversation_id, person_id, role) values (v_id, v_me, 'owner');
  insert into public.conversation_members (conversation_id, person_id)
  select v_id, m from unnest(p_members) m where m between 1 and 99 and m <> v_me on conflict do nothing;
  insert into public.messages (conversation_id, from_id, kind, text) values (v_id, v_me, 'system', 'created');
  return v_id;
end $$;

create or replace function public.update_group(p_conv bigint, p_title text, p_avatar text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); v_title text := nullif(trim(coalesce(p_title, '')), '');
begin
  if (select kind from public.conversations where id = p_conv) <> 'group' then raise exception 'bad_request'; end if;
  if public.conv_role(p_conv) not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_title is null or char_length(v_title) > 60 then raise exception 'bad_title'; end if;
  update public.conversations set title = v_title, avatar = nullif(p_avatar, '') where id = p_conv;
  insert into public.messages (conversation_id, from_id, kind, text) values (p_conv, v_me, 'system', 'renamed:' || v_title);
end $$;

create or replace function public.add_members(p_conv bigint, p_members int[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); v_added int[];
begin
  if (select kind from public.conversations where id = p_conv) <> 'group' then raise exception 'bad_request'; end if;
  if public.conv_role(p_conv) not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  with ins as (
    insert into public.conversation_members (conversation_id, person_id, last_read_id)
    select p_conv, m, coalesce((select max(id) from public.messages where conversation_id = p_conv), 0)
    from unnest(p_members) m where m between 1 and 99 on conflict do nothing returning person_id
  ) select array_agg(person_id) into v_added from ins;
  if v_added is not null then
    insert into public.messages (conversation_id, from_id, kind, text) values (p_conv, v_me, 'system', 'added:' || array_to_string(v_added, ','));
  end if;
end $$;

create or replace function public.remove_member(p_conv bigint, p_person int) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); v_role text := public.conv_role(p_conv); v_target text;
begin
  if (select kind from public.conversations where id = p_conv) <> 'group' then raise exception 'bad_request'; end if;
  select role into v_target from public.conversation_members where conversation_id = p_conv and person_id = p_person;
  if v_target is null then return; end if;
  if v_role = 'owner' or (v_role = 'admin' and v_target = 'member') then
    delete from public.conversation_members where conversation_id = p_conv and person_id = p_person;
    insert into public.messages (conversation_id, from_id, kind, text) values (p_conv, v_me, 'system', 'removed:' || p_person);
  else
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

create or replace function public.set_member_role(p_conv bigint, p_person int, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.conv_role(p_conv) <> 'owner' or p_role not in ('admin', 'member') or p_person = public.my_person() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.conversation_members set role = p_role where conversation_id = p_conv and person_id = p_person and role <> 'owner';
end $$;

create or replace function public.leave_conversation(p_conv bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); v_role text := public.conv_role(p_conv); v_next int;
begin
  if (select kind from public.conversations where id = p_conv) <> 'group' then raise exception 'cannot_leave'; end if;
  if v_role is null then return; end if;
  delete from public.conversation_members where conversation_id = p_conv and person_id = v_me;
  if v_role = 'owner' then
    select person_id into v_next from public.conversation_members where conversation_id = p_conv
    order by (role = 'admin') desc, joined_at limit 1;
    if v_next is not null then update public.conversation_members set role = 'owner' where conversation_id = p_conv and person_id = v_next; end if;
  end if;
  insert into public.messages (conversation_id, from_id, kind, text) values (p_conv, v_me, 'system', 'left');
end $$;

-- Soft delete: the bubble says "Message deleted". The author, or a group owner/admin, may delete.
create or replace function public.delete_message(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); m record;
begin
  select id, from_id, conversation_id, deleted_at into m from public.messages where id = p_id;
  if m.id is null or not public.is_conv_member(m.conversation_id) then raise exception 'not_found'; end if;
  if m.from_id <> v_me and coalesce(public.conv_role(m.conversation_id), '') not in ('owner', 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.messages set deleted_at = now(), text = '', attachments = '[]'::jsonb, reactions = '{}'::jsonb, pinned_at = null, pinned_by = null
  where id = p_id and deleted_at is null;
end $$;

create or replace function public.pin_message(p_id bigint, p_pin boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); v_conv bigint; v_kind text;
begin
  select m.conversation_id, c.kind into v_conv, v_kind from public.messages m join public.conversations c on c.id = m.conversation_id
  where m.id = p_id and m.deleted_at is null;
  if v_conv is null or not public.is_conv_member(v_conv) then raise exception 'not_found'; end if;
  if v_kind <> 'direct' and public.conv_role(v_conv) not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.messages set pinned_at = case when p_pin then now() end, pinned_by = case when p_pin then v_me end where id = p_id;
end $$;

-- Forward: copies text and attachments into another conversation I am in.
create or replace function public.forward_message(p_id bigint, p_conv bigint, p_client uuid) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); m record; v_new bigint;
begin
  select * into m from public.messages where id = p_id and deleted_at is null;
  if m.id is null or not public.is_conv_member(m.conversation_id) or not public.is_conv_member(p_conv) then raise exception 'not_found'; end if;
  if m.kind = 'system' then raise exception 'bad_request'; end if;
  insert into public.messages (conversation_id, from_id, kind, text, attachments, forwarded_from, client_id)
  values (p_conv, v_me, m.kind, m.text, m.attachments, coalesce(m.forwarded_from, m.id), p_client)
  on conflict (client_id) do nothing returning id into v_new;
  return v_new;
end $$;

create or replace function public.react_message(p_id bigint, p_emoji text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_me int := public.my_person(); v_r jsonb; v_list jsonb;
begin
  if v_me is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_emoji is null or char_length(p_emoji) > 16 or p_emoji = '' then raise exception 'bad_request'; end if;
  select reactions into v_r from public.messages m where m.id = p_id and m.deleted_at is null and public.is_conv_member(m.conversation_id) for update;
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

-- Inbox: my conversations with the last message and my unread count, newest first.
create or replace function public.inbox()
returns table (id bigint, kind text, title text, avatar text, last_message_at timestamptz, pinned boolean, muted boolean, my_role text,
               last_read_id bigint, unread int, members int[], last jsonb)
language sql stable security definer set search_path = '' as $$
  with me as (select public.my_person() as p)
  select c.id, c.kind, c.title, c.avatar, c.last_message_at, cm.pinned, cm.muted, cm.role, cm.last_read_id,
    (select count(*)::int from public.messages m where m.conversation_id = c.id and m.id > cm.last_read_id and m.from_id <> me.p and m.deleted_at is null and m.kind <> 'system'),
    (select array_agg(x.person_id order by x.person_id) from public.conversation_members x where x.conversation_id = c.id),
    (select jsonb_build_object('id', l.id, 'from_id', l.from_id, 'kind', l.kind, 'text', left(l.text, 140), 'deleted', l.deleted_at is not null,
                               'n', jsonb_array_length(l.attachments), 'created_at', l.created_at)
       from public.messages l where l.conversation_id = c.id order by l.id desc limit 1)
  from me join public.conversation_members cm on cm.person_id = me.p
  join public.conversations c on c.id = cm.conversation_id
  order by cm.pinned desc, c.last_message_at desc
$$;

create or replace function public.mark_read(p_conv bigint, p_upto bigint) returns void
language sql security definer set search_path = '' as $$
  update public.conversation_members set last_read_id = greatest(last_read_id, least(p_upto, (select coalesce(max(id), 0) from public.messages where conversation_id = p_conv)))
  where conversation_id = p_conv and person_id = public.my_person();
$$;

create or replace function public.search_messages(p_q text) returns setof public.messages
language sql stable security definer set search_path = '' as $$
  select m.* from public.messages m
  where char_length(trim(coalesce(p_q, ''))) >= 2 and m.deleted_at is null and m.kind in ('text', 'photo', 'voice', 'post')
    and m.text ilike '%' || replace(replace(replace(trim(p_q), '\', '\\'), '%', '\%'), '_', '\_') || '%'
    and m.conversation_id in (select conversation_id from public.conversation_members where person_id = public.my_person())
  order by m.id desc limit 50
$$;

revoke all on function public.is_conv_member(bigint), public.conv_role(bigint), public.direct_conversation(int, int),
  public.messages_before_insert(), public.messages_after_insert() from public, anon, authenticated;
grant execute on function public.is_conv_member(bigint), public.conv_role(bigint) to authenticated;
revoke all on function public.open_direct(int), public.create_group(text, int[]), public.update_group(bigint, text, text),
  public.add_members(bigint, int[]), public.remove_member(bigint, int), public.set_member_role(bigint, int, text),
  public.leave_conversation(bigint), public.delete_message(bigint), public.pin_message(bigint, boolean),
  public.forward_message(bigint, bigint, uuid), public.inbox(), public.mark_read(bigint, bigint), public.search_messages(text) from public, anon;
grant execute on function public.open_direct(int), public.create_group(text, int[]), public.update_group(bigint, text, text),
  public.add_members(bigint, int[]), public.remove_member(bigint, int), public.set_member_role(bigint, int, text),
  public.leave_conversation(bigint), public.delete_message(bigint), public.pin_message(bigint, boolean),
  public.forward_message(bigint, bigint, uuid), public.inbox(), public.mark_read(bigint, bigint), public.search_messages(text) to authenticated;

-- 6. Realtime: changes to members (read receipts, new groups) and conversations.
alter publication supabase_realtime add table public.conversation_members, public.conversations;

-- Typing indicators use private Realtime channels "conv:<id>"; only members may join.
create policy "conv channel read" on realtime.messages for select to authenticated using (
  split_part(realtime.topic(), ':', 1) = 'conv' and public.is_conv_member(nullif(split_part(realtime.topic(), ':', 2), '')::bigint)
);
create policy "conv channel write" on realtime.messages for insert to authenticated with check (
  split_part(realtime.topic(), ':', 1) = 'conv' and public.is_conv_member(nullif(split_part(realtime.topic(), ':', 2), '')::bigint)
);

-- 7. Private media for chats: "<conversation_id>/<random>.<ext>".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 10485760, array['image/webp', 'image/jpeg', 'image/png', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac'])
on conflict (id) do nothing;
create policy "chat read" on storage.objects for select to authenticated using (
  bucket_id = 'chat' and (
    public.is_conv_member(nullif((storage.foldername(name))[1], '')::bigint)
    -- forwarded files stay readable in the conversations they were forwarded to
    or exists (select 1 from public.messages m where m.attachments @> jsonb_build_array(jsonb_build_object('path', name))
               and public.is_conv_member(m.conversation_id))
  )
);
create policy "chat upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'chat' and public.is_conv_member(nullif((storage.foldername(name))[1], '')::bigint)
);
create policy "chat delete own" on storage.objects for delete to authenticated using (bucket_id = 'chat' and owner_id = auth.uid()::text);

-- Pinned / muted belong to my own membership row.
create or replace function public.set_conv_flag(p_conv bigint, p_flag text, p_value boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_flag not in ('pinned', 'muted') then raise exception 'bad_request'; end if;
  update public.conversation_members
  set pinned = case when p_flag = 'pinned' then p_value else pinned end,
      muted = case when p_flag = 'muted' then p_value else muted end
  where conversation_id = p_conv and person_id = public.my_person();
end $$;
revoke all on function public.set_conv_flag(bigint, text, boolean) from public, anon;
grant execute on function public.set_conv_flag(bigint, text, boolean) to authenticated;
