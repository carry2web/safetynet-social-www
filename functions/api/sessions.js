/**
 * Cloudflare Pages Function — /api/sessions
 *
 * Bindings (CF Pages → Settings → Functions):
 *   KV namespace : SESSIONS_KV  → "safetynet-sessions"
 *   Secret       : ADMIN_PASSWORD
 *
 * GET    /api/sessions  — list all (public)
 * POST   /api/sessions  — add session
 * PUT    /api/sessions  — edit session by id
 * DELETE /api/sessions  — delete session by id
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const res = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

async function load(env) {
  const raw = await env.SESSIONS_KV.get('sessions');
  return raw ? JSON.parse(raw) : [];
}

async function save(env, sessions) {
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
  await env.SESSIONS_KV.put('sessions', JSON.stringify(sessions));
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // Public read
  if (request.method === 'GET') return res(await load(env));

  // All writes need a body + password
  let body;
  try { body = await request.json(); } catch { return res({ error: 'Invalid JSON' }, 400); }
  if (!body.password || body.password !== env.ADMIN_PASSWORD) return res({ error: 'Unauthorized' }, 401);

  // POST — add
  if (request.method === 'POST') {
    if (body._check) return res({ error: 'date, title and speaker are required' }, 400);
    const { date, title, speaker, description = '', recording = '' } = body;
    if (!date || !title || !speaker) return res({ error: 'date, title and speaker are required' }, 400);
    const sessions = await load(env);
    sessions.push({ id: Date.now(), date, title, speaker, description, recording });
    await save(env, sessions);
    return res({ ok: true });
  }

  // PUT — edit
  if (request.method === 'PUT') {
    const { id, date, title, speaker, description = '', recording = '' } = body;
    if (!id || !date || !title || !speaker) return res({ error: 'id, date, title and speaker are required' }, 400);
    const sessions = await load(env);
    const i = sessions.findIndex(s => s.id === id);
    if (i === -1) return res({ error: 'Not found' }, 404);
    sessions[i] = { id, date, title, speaker, description, recording };
    await save(env, sessions);
    return res({ ok: true });
  }

  // DELETE
  if (request.method === 'DELETE') {
    if (!body.id) return res({ error: 'id is required' }, 400);
    const sessions = await load(env);
    await save(env, sessions.filter(s => s.id !== body.id));
    return res({ ok: true });
  }

  return res({ error: 'Method not allowed' }, 405);
}
