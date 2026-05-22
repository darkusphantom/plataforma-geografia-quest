import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseBody } from './utils';

/**
 * POST /api/notion/register
 * Registra un nuevo estudiante en Notion.
 * Previene duplicados verificando si la cédula ya existe.
 *
 * @body {{ cedula: string; password: string }}
 * @returns {{ ok: true; pageId: string; cedula: string } | { ok: false; error: string }}
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const body = await parseBody(req);
  const { cedula, password } = body as { cedula?: string; password?: string };

  if (!cedula || !password) {
    return res.status(400).json({ ok: false, error: 'Cédula y contraseña son requeridas.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 4 caracteres.' });
  }

  const NOTION_KEY = process.env.NOTION_KEY!;
  const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
  const DB_ID = process.env.NOTION_DB_STUDENTS!;
  const HEADERS = {
    Authorization: `Bearer ${NOTION_KEY}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };

  // 1. Verificar que la cédula no esté registrada
  const checkRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      filter: { property: 'Cedula', title: { equals: cedula.trim() } },
    }),
  });

  if (!checkRes.ok) {
    return res.status(502).json({ ok: false, error: 'Error al verificar duplicados.' });
  }

  const checkData = await checkRes.json() as { results: unknown[] };
  if (checkData.results.length > 0) {
    return res.status(409).json({ ok: false, error: 'Esta cédula ya está registrada.' });
  }

  // 2. Crear el estudiante con la contraseña (ya viene hasheada desde el cliente)
  const createRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      parent: { database_id: DB_ID },
      properties: {
        'Cedula': { title: [{ text: { content: cedula.trim() } }] },
        'Password': { rich_text: [{ text: { content: password } }] },
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('[register] Notion create error:', err);
    return res.status(502).json({ ok: false, error: 'Error al crear el registro.' });
  }

  const newPage = await createRes.json() as { id: string };

  return res.status(201).json({ ok: true, pageId: newPage.id, cedula: cedula.trim() });
}
