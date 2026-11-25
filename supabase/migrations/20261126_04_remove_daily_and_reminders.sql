-- Stage B: the daily question, streaks and the evening reminders are removed (product decision 26.11.2026).
-- Safety copy of the answers until the stage is confirmed: backup_20261126.daily_answers_final.
create table if not exists backup_20261126.daily_answers_final as table public.daily_answers;
select cron.unschedule(jobid) from cron.job where jobname in ('push-daily', 'push-streak');
drop function if exists public.notify_scheduled(text);
drop table if exists public.daily_answers;
update public.push_subs set prefs = prefs - 'daily' where prefs ? 'daily';
create index if not exists messages_from_idx on public.messages (from_id);
