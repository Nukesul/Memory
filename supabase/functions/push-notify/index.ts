// Sends Web Push notifications. Called by database triggers and by pg_cron, never by the browser.
// Auth: the x-push-secret header must match push_config.secret (deployed with verify_jwt = false on purpose).
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const FIRST: Record<number, string> = {
  1: 'Asyl', 2: 'Nursultan', 3: 'Madara', 4: 'Baiel', 5: 'Anjery', 6: 'Nabira', 7: 'Chacha', 8: 'Nyamu', 9: 'Aun', 10: 'Otchini',
  11: 'Rukumaru', 12: 'Ko', 13: 'Sharuri', 14: 'Sukura', 15: 'Unda', 16: 'Azjargal', 17: 'Beruguti', 18: 'Otogo', 19: 'Yadana', 20: 'Suman',
};

const TXT: Record<string, Record<string, string>> = {
  en: { classRoom: 'Class chat', note: 'wrote you a note', announce: 'Announcement from the class admin', dailyTitle: 'Today’s question is waiting', dailyBody: 'One line, one tap. See how everyone answered.', streakTitle: '🔥 Keep your streak alive', streakBody: 'Answer today’s question before midnight.' },
  ru: { classRoom: 'Чат класса', note: 'написал(а) вам заметку', announce: 'Объявление от админа класса', dailyTitle: 'Вопрос дня ждёт вас', dailyBody: 'Одна строка, один тап. Посмотрите, как ответили все.', streakTitle: '🔥 Не потеряйте серию', streakBody: 'Ответьте на вопрос дня до полуночи.' },
  ja: { classRoom: 'クラスチャット', note: 'があなたにメモを書きました', announce: 'クラス管理者からのお知らせ', dailyTitle: '今日の質問が待っています', dailyBody: '一言だけ。みんなの答えを見よう。', streakTitle: '🔥 連続記録を守ろう', streakBody: '今日の質問に、日付が変わる前に答えてね。' },
};
const tx = (lang: string) => TXT[lang] ?? TXT.en;

const clip = (s: string, n = 110) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
const shift = (day: string, d: number) => new Date(new Date(day + 'T00:00:00Z').getTime() + d * 864e5).toISOString().slice(0, 10);
function streakOf(days: Set<string>, now: string) {
  let d = days.has(now) ? now : shift(now, -1);
  let n = 0;
  while (days.has(d)) { n++; d = shift(d, -1); }
  return n;
}

type Sub = { endpoint: string; person_id: number; p256dh: string; auth: string; lang: string; prefs: Record<string, boolean> };
type Job = { sub: Sub; payload: { title: string; body: string; url: string; tag: string } };

async function config() {
  const { data, error } = await sb.from('push_config').select('key,value');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
}
async function names() {
  const { data } = await sb.from('profiles').select('id,data');
  const out: Record<number, string> = { ...FIRST };
  for (const r of data ?? []) {
    const n = r.data?.name;
    if (typeof n === 'string' && n.trim()) out[r.id] = n.trim().split(/\s+/)[0];
  }
  return out;
}
async function subs(filter: (s: Sub) => boolean) {
  const { data, error } = await sb.from('push_subs').select('*');
  if (error) throw error;
  return ((data ?? []) as Sub[]).filter(filter);
}

async function plan(kind: string, rec: any): Promise<Job[]> {
  const N = await names();
  const jobs: Job[] = [];
  if (kind === 'message') {
    const from = N[rec.from_id] ?? '?';
    if (rec.to_id == null) {
      for (const s of await subs((s) => s.person_id !== rec.from_id && s.prefs?.class !== false)) {
        jobs.push({ sub: s, payload: { title: `${from} · ${tx(s.lang).classRoom}`, body: clip(rec.text), url: '#/chat/all', tag: 'chat-all' } });
      }
    } else {
      for (const s of await subs((s) => s.person_id === rec.to_id && s.prefs?.dm !== false)) {
        jobs.push({ sub: s, payload: { title: from, body: clip(rec.text), url: `#/chat/${rec.from_id}`, tag: `dm-${rec.from_id}` } });
      }
    }
  } else if (kind === 'note') {
    const from = N[rec.from_id] ?? '?';
    for (const s of await subs((s) => s.person_id === rec.to_id && s.prefs?.notes !== false)) {
      jobs.push({ sub: s, payload: { title: `${from} ${tx(s.lang).note}`, body: clip(rec.text), url: `#/p/${rec.to_id}`, tag: 'note' } });
    }
  } else if (kind === 'announcement') {
    for (const s of await subs((s) => s.prefs?.news !== false)) {
      jobs.push({ sub: s, payload: { title: tx(s.lang).announce, body: clip(rec.text), url: '#/', tag: 'announce' } });
    }
  } else if (kind === 'daily' || kind === 'streak') {
    const now = today();
    const { data } = await sb.from('daily_answers').select('day,person_id').gte('day', shift(now, -60));
    const byPerson = new Map<number, Set<string>>();
    for (const r of data ?? []) {
      if (!byPerson.has(r.person_id)) byPerson.set(r.person_id, new Set());
      byPerson.get(r.person_id)!.add(r.day);
    }
    for (const s of await subs((s) => s.prefs?.daily !== false)) {
      const days = byPerson.get(s.person_id) ?? new Set<string>();
      if (days.has(now)) continue; // already answered today
      const n = streakOf(days, now);
      const t = tx(s.lang);
      if (kind === 'daily') {
        jobs.push({ sub: s, payload: { title: t.dailyTitle, body: n >= 2 ? `🔥 ${n} · ${t.dailyBody}` : t.dailyBody, url: '#/today', tag: 'daily' } });
      } else if (n >= 2) {
        jobs.push({ sub: s, payload: { title: `${t.streakTitle} (${n})`, body: t.streakBody, url: '#/today', tag: 'daily' } });
      }
    }
  }
  return jobs;
}

Deno.serve(async (req) => {
  try {
    const cfg = await config();
    if (!cfg.secret || req.headers.get('x-push-secret') !== cfg.secret) return new Response('forbidden', { status: 403 });
    webpush.setVapidDetails(cfg.vapid_subject, cfg.vapid_public, cfg.vapid_private);
    const { kind, record } = await req.json();
    const jobs = await plan(kind, record ?? {});
    let sent = 0, failed = 0, removed = 0;
    await Promise.all(
      jobs.map(async ({ sub, payload }) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), {
            TTL: kind === 'message' || kind === 'note' ? 3600 * 6 : 3600 * 3,
            urgency: kind === 'message' ? 'high' : 'normal',
          });
          sent++;
        } catch (e: any) {
          failed++;
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await sb.from('push_subs').delete().eq('endpoint', sub.endpoint);
            removed++;
          } else {
            console.error('push failed', e?.statusCode, String(e?.body ?? e?.message ?? e).slice(0, 200));
          }
        }
      }),
    );
    return new Response(JSON.stringify({ kind, targets: jobs.length, sent, failed, removed }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
