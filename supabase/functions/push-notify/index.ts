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
  en: { classRoom: 'Class chat', note: 'wrote you a note', announce: 'Announcement from the class admin', photo: '📷 Photo', voice: '🎤 Voice message', post: '🖼 Shared a post', story: '↩︎ Replied to your story' },
  ru: { classRoom: 'Чат класса', note: 'написал(а) вам заметку', announce: 'Объявление от админа класса', photo: '📷 Фото', voice: '🎤 Голосовое сообщение', post: '🖼 Поделился(-ась) публикацией', story: '↩︎ Ответ на вашу историю' },
  ja: { classRoom: 'クラスチャット', note: 'があなたにメモを書きました', announce: 'クラス管理者からのお知らせ', photo: '📷 写真', voice: '🎤 ボイスメッセージ', post: '🖼 投稿をシェアしました', story: '↩︎ ストーリーに返信しました' },
};
const tx = (lang: string) => TXT[lang] ?? TXT.en;

const clip = (s: string, n = 110) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
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
    if (rec.kind === 'system' || rec.deleted_at) return jobs;
    const from = N[rec.from_id] ?? '?';
    const { data: conv } = await sb.from('conversations').select('id,kind,title').eq('id', rec.conversation_id).single();
    if (!conv) return jobs;
    const { data: mem } = await sb.from('conversation_members').select('person_id,muted').eq('conversation_id', conv.id);
    const targets = new Set((mem ?? []).filter((m) => m.person_id !== rec.from_id && !m.muted).map((m) => m.person_id));
    const pref = conv.kind === 'class' ? 'class' : 'dm';
    for (const s of await subs((s) => targets.has(s.person_id) && s.prefs?.[pref] !== false)) {
      const t = tx(s.lang);
      const body = rec.kind === 'photo' ? `${t.photo}${rec.text ? ' · ' + rec.text : ''}` : rec.kind === 'voice' ? t.voice : rec.kind === 'post' ? t.post : rec.kind === 'story_reply' ? `${t.story}: ${rec.text}` : rec.text;
      const title = conv.kind === 'direct' ? from : `${from} · ${conv.kind === 'class' ? t.classRoom : conv.title}`;
      jobs.push({ sub: s, payload: { title, body: clip(body || ''), url: `#/chat/c${conv.id}`, tag: `conv-${conv.id}` } });
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
