/**
 * dev-api.mjs
 * Servidor Express mínimo que simula el comportamiento de las funciones
 * serverless de Vercel en entorno de desarrollo local.
 *
 * Uso: node --env-file=.env dev-api.mjs
 * (requiere Node >= 20.6 para --env-file, o carga manual de dotenv)
 *
 * En producción este archivo NO se usa — Vercel ejecuta directamente /api/*.ts
 */

import { createServer } from 'http';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

// ── Cargar .env manualmente si no se usó --env-file ──────────────────────────
// (Node 20.6+ ya lo carga con --env-file=.env)

const NOTION_KEY = process.env.NOTION_KEY;
const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
const DB_STUDENTS = process.env.NOTION_DB_STUDENTS;
const DB_ANSWERS = process.env.NOTION_DB_ANSWERS;
const PORT = 3000;

if (!NOTION_KEY || !DB_STUDENTS || !DB_ANSWERS) {
  console.error('❌ Faltan variables de entorno. Verifica .env');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function notionHeaders() {
  return {
    Authorization: `Bearer ${NOTION_KEY}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Body inválido'));
      }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleLogin(req, res) {
  const { cedula, password } = await readBody(req);
  if (!cedula || !password) return json(res, 400, { ok: false, error: 'Cédula y contraseña requeridas.' });

  // El cliente ya envía la contraseña hasheada
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${DB_STUDENTS}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ filter: { property: 'Cedula', title: { equals: cedula.trim() } } }),
  });

  const data = await queryRes.json();
  if (!data.results?.length) return json(res, 401, { ok: false, error: 'Cédula no registrada.' });

  const page = data.results[0];
  const storedHash = page.properties['Password']?.rich_text?.[0]?.text?.content ?? '';

  if (storedHash !== password) return json(res, 401, { ok: false, error: 'Contraseña incorrecta.' });

  return json(res, 200, { ok: true, pageId: page.id, cedula: cedula.trim() });
}

async function handleRegister(req, res) {
  const { cedula, password } = await readBody(req);
  if (!cedula || !password) return json(res, 400, { ok: false, error: 'Cédula y contraseña requeridas.' });

  // Verificar duplicado
  const check = await fetch(`https://api.notion.com/v1/databases/${DB_STUDENTS}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ filter: { property: 'Cedula', title: { equals: cedula.trim() } } }),
  });
  const checkData = await check.json();
  if (checkData.results?.length) return json(res, 409, { ok: false, error: 'Esta cédula ya está registrada.' });

  // El cliente ya envía la contraseña hasheada
  const create = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: DB_STUDENTS },
      properties: {
        'Cedula': { title: [{ text: { content: cedula.trim() } }] },
        'Password': { rich_text: [{ text: { content: password } }] },
      },
    }),
  });

  if (!create.ok) {
    const err = await create.text();
    console.error('[register] Notion error:', err);
    return json(res, 502, { ok: false, error: 'Error al crear el registro.' });
  }

  const newPage = await create.json();
  return json(res, 201, { ok: true, pageId: newPage.id, cedula: cedula.trim() });
}

async function handleSaveAnswer(req, res) {
  const body = await readBody(req);
  const { studentPageId, preguntaId, modulo, respuesta, puntaje } = body;

  if (!studentPageId || !preguntaId || !modulo || respuesta === undefined || puntaje === undefined) {
    return json(res, 400, { ok: false, error: 'Faltan campos requeridos.' });
  }

  const create = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: DB_ANSWERS },
      properties: {
        'Pregunta ID': { title: [{ text: { content: preguntaId } }] },
        'Estudiante': { relation: [{ id: studentPageId }] },
        'Modulo': { select: { name: modulo } },
        'Respuesta': { rich_text: [{ text: { content: String(respuesta).slice(0, 2000) } }] },
        'Puntaje': { number: puntaje },
        'Fecha': { date: { start: new Date().toISOString() } },
      },
    }),
  });

  if (!create.ok) {
    const err = await create.text();
    console.error('[save-answer] Notion error:', err);
    return json(res, 502, { ok: false, error: 'Error al guardar la respuesta.' });
  }

  const page = await create.json();
  return json(res, 201, { ok: true, pageId: page.id });
}

async function handleGetAnswers(req, res, url) {
  const studentPageId = url.searchParams.get('studentPageId');
  if (!studentPageId) return json(res, 400, { ok: false, error: 'studentPageId requerido.' });

  const query = await fetch(`https://api.notion.com/v1/databases/${DB_ANSWERS}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ filter: { property: 'Estudiante', relation: { contains: studentPageId } } }),
  });

  const data = await query.json();
  const answers = (data.results ?? []).map((page) => ({
    id: page.id,
    preguntaId: page.properties['Pregunta ID']?.title?.[0]?.text?.content ?? '',
    modulo: page.properties['Modulo']?.select?.name ?? '',
    respuesta: page.properties['Respuesta']?.rich_text?.[0]?.text?.content ?? '',
    puntaje: page.properties['Puntaje']?.number ?? 0,
    fecha: page.properties['Fecha']?.date?.start ?? '',
  }));

  return json(res, 200, { ok: true, answers });
}

// ── Server ────────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  try {
    if (path === '/api/notion/login' && req.method === 'POST') return await handleLogin(req, res);
    if (path === '/api/notion/register' && req.method === 'POST') return await handleRegister(req, res);
    if (path === '/api/notion/save-answer' && req.method === 'POST') return await handleSaveAnswer(req, res);
    if (path === '/api/notion/get-answers' && req.method === 'GET') return await handleGetAnswers(req, res, url);

    json(res, 404, { ok: false, error: `Ruta no encontrada: ${path}` });
  } catch (err) {
    console.error('[dev-api] Error:', err);
    json(res, 500, { ok: false, error: 'Error interno del servidor de desarrollo.' });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ El puerto ${PORT} ya está en uso.`);
    console.error(`   Solución: mata el proceso anterior con:`);
    console.error(`   npx kill-port ${PORT}\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev API Server corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoints disponibles:`);
  console.log(`   POST  /api/notion/login`);
  console.log(`   POST  /api/notion/register`);
  console.log(`   POST  /api/notion/save-answer`);
  console.log(`   GET   /api/notion/get-answers\n`);
});
