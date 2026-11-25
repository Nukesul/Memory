// Invite-only accounts for Memoris.
//   { action: 'info',  code }                    -> { person_id, kind }
//   { action: 'join',  code, email, password }   -> { ok: true }   (then the browser signs in with email + password)
//   { action: 'reset', code, password }          -> { ok: true }
// The code is single-use and expires (14 days to join, 24 hours to reset). Only its SHA-256 is stored.
// The service role key never leaves this function.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const fail = (error: string, status = 400) => json({ error }, status);

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const CODE_RE = /^[A-Za-z0-9_-]{16,64}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;
const okPassword = (p: unknown) => typeof p === 'string' && p.length >= 8 && p.length <= 72;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('method', 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail('bad_request');
  }
  const { action, code } = body;
  if (typeof code !== 'string' || !CODE_RE.test(code)) return fail('invalid', 404);
  const hash = await sha256(code);

  const { data: found, error: lookErr } = await admin.rpc('invite_lookup', { p_hash: hash });
  if (lookErr) return fail('server', 500);
  const inv = found?.[0] as { person_id: number; kind: string } | undefined;
  if (!inv) return fail('invalid', 404);

  if (action === 'info') return json({ person_id: inv.person_id, kind: inv.kind });

  if (action === 'join') {
    if (inv.kind !== 'join') return fail('invalid', 404);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!EMAIL_RE.test(email) || email.length > 254) return fail('bad_email');
    if (!okPassword(body.password)) return fail('weak_password');

    const { data: existing } = await admin.from('accounts').select('person_id').eq('person_id', inv.person_id).maybeSingle();
    if (existing) return fail('already_registered', 409);

    // Claim first, atomically: a second request with the same code gets nothing.
    const { data: person, error: claimErr } = await admin.rpc('claim_invite', { p_hash: hash, p_kind: 'join' });
    if (claimErr || !person) return fail('invalid', 404);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: body.password as string,
      email_confirm: true,
      app_metadata: { person_id: person },
    });
    if (createErr || !created?.user) {
      await admin.rpc('unclaim_invite', { p_hash: hash });
      const taken = /already|registered|exists/i.test(createErr?.message || '');
      return fail(taken ? 'email_taken' : 'server', taken ? 409 : 500);
    }
    const { error: linkErr } = await admin.from('accounts').insert({ person_id: person, user_id: created.user.id, email });
    if (linkErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      await admin.rpc('unclaim_invite', { p_hash: hash });
      return fail('already_registered', 409);
    }
    return json({ ok: true, email });
  }

  if (action === 'reset') {
    if (inv.kind !== 'reset') return fail('invalid', 404);
    if (!okPassword(body.password)) return fail('weak_password');
    const { data: acc } = await admin.from('accounts').select('user_id,email').eq('person_id', inv.person_id).maybeSingle();
    if (!acc) return fail('no_account', 404);
    const { data: person, error: claimErr } = await admin.rpc('claim_invite', { p_hash: hash, p_kind: 'reset' });
    if (claimErr || !person) return fail('invalid', 404);
    const { error: updErr } = await admin.auth.admin.updateUserById(acc.user_id, { password: body.password as string });
    if (updErr) {
      await admin.rpc('unclaim_invite', { p_hash: hash });
      return fail(/password/i.test(updErr.message) ? 'weak_password' : 'server', 400);
    }
    await admin.rpc('revoke_sessions', { p_user: acc.user_id }); // sign out every old device
    return json({ ok: true, email: acc.email });
  }

  return fail('bad_request');
});
