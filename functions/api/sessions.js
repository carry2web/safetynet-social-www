/**
 * Cloudflare Pages Function — /api/sessions
 *
 * Bindings required (set in CF Pages → Settings → Functions):
 *   KV namespace : SESSIONS_KV  → a KV namespace you create named e.g. "safetynet-sessions"
 *   Env variable : ADMIN_PASSWORD → your chosen admin password (plain text, stored as CF secret)
 *
 * Endpoints:
 *   GET    /api/sessions           — returns all sessions (public)
 *   POST   /api/sessions           — adds a session (password required)
 *   DELETE /api/sessions           — deletes a session by id (password required)
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // ── GET — public list ────────────────────────────────────────────────────
  if (request.method === 'GET') {
    const raw = await env.SESSIONS_KV.get('sessions');
    const sessions = raw ? JSON.parse(raw) : [];
    return json(sessions);
  }

  // ── POST — add session ───────────────────────────────────────────────────
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    if (!body.password || body.password !== env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { date, title, speaker, description } = body;
    if (!date || !title || !speaker) {
      return json({ error: 'date, title and speaker are required' }, 400);
    }

    const raw      = await env.SESSIONS_KV.get('sessions');
    const sessions = raw ? JSON.parse(raw) : [];

    sessions.push({
      id:          Date.now(),
      date,          // ISO date string  e.g. "2025-09-07"
      title,
      speaker,
      description:   description || '',
    });

    // Keep sorted by date ascending
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    await env.SESSIONS_KV.put('sessions', JSON.stringify(sessions));
    return json({ ok: true });
  }

  // ── DELETE — remove session ──────────────────────────────────────────────
  if (request.method === 'DELETE') {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    if (!body.password || body.password !== env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (!body.id) return json({ error: 'id is required' }, 400);

    const raw      = await env.SESSIONS_KV.get('sessions');
    const sessions = raw ? JSON.parse(raw) : [];
    const filtered = sessions.filter(s => s.id !== body.id);

    await env.SESSIONS_KV.put('sessions', JSON.stringify(filtered));
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
