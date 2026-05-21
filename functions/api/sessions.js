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

// Migration logic: upgrade old session formats to current format
function migrateSessions(sessions) {
  return sessions.map(s => {
    // If session is a string (old format), skip (or handle as needed)
    if (typeof s === 'string') return { id: Date.now(), date: '', title: s, speaker: '', description: '', recording: '' };
    // If missing fields, add them
    return {
      id: s.id || Date.now(),
      date: s.date || '',
      title: s.title || '',
      speaker: s.speaker || '',
      description: s.description !== undefined ? s.description : '',
      recording: s.recording !== undefined ? s.recording : ''
    };
  });
}

async function load(env) {
  const raw = await env.SESSIONS_KV.get('sessions');
  if (!raw) return [];
  let sessions;
  try {
    sessions = JSON.parse(raw);
  } catch (e) {
    // If parsing fails, return empty and do not overwrite
    return [];
  }
  // Migrate if needed
  return migrateSessions(sessions);
}

// Save with backup: before writing, backup current sessions
async function save(env, sessions) {
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
  // Backup current sessions
  const oldRaw = await env.SESSIONS_KV.get('sessions');
  if (oldRaw) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await env.SESSIONS_KV.put(`sessions-backup-${timestamp}`, oldRaw);
  }
  await env.SESSIONS_KV.put('sessions', JSON.stringify(sessions));
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // Public read
  if (request.method === 'GET') return res(await load(env));

  // All writes need a body + password
  let body;
  try { body = await request.json(); } catch (e) {
    console.log('Invalid JSON:', e);
    return res({ error: 'Invalid JSON' }, 400);
  }
  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    console.log('Unauthorized attempt:', body && body.password);
    return res({ error: 'Unauthorized' }, 401);
  }

  // POST — add
  if (request.method === 'POST') {
    if (body._check) return res({ ok: true }, 200);
    const { date, title, speaker, description = '', recording = '' } = body;
    if (!date || !title || !speaker) {
      console.log('Add failed: missing fields', { date, title, speaker });
      return res({ error: 'date, title and speaker are required' }, 400);
    }
    const sessions = await load(env);
    sessions.push({ id: Date.now(), date, title, speaker, description, recording });
    await save(env, sessions);
    return res({ ok: true });
  }

  // PUT — edit
  if (request.method === 'PUT') {
    const { id, date, title, speaker, description = '', recording = '' } = body;
    if (!id || !date || !title || !speaker) {
      console.log('Edit failed: missing fields', { id, date, title, speaker });
      return res({ error: 'id, date, title and speaker are required' }, 400);
    }
    const sessions = await load(env);
    const i = sessions.findIndex(s => s.id === id);
    if (i === -1) {
      console.log('Edit failed: session not found', { id });
      return res({ error: 'Not found' }, 404);
    }
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
