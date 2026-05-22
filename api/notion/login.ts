import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseBody } from './utils';

/**
 * POST /api/notion/login
 * Busca un estudiante por cédula y valida su contraseña.
 *
 * @body {{ cedula: string; password: string }}
 * @returns {{ ok: true; pageId: string; cedula: string } | { ok: false; error: string }}
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Preflight CORS
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

  const NOTION_KEY = process.env.NOTION_KEY!;
  const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
  const DB_ID = process.env.NOTION_DB_STUDENTS!;

  // Buscar estudiante por cédula en Notion
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      filter: {
        property: 'Cedula',
        title: { equals: cedula.trim() },
      },
    }),
  });

  if (!queryRes.ok) {
    const err = await queryRes.text();
    console.error('[login] Notion query error:', err);
    return res.status(502).json({ ok: false, error: 'Error al conectar con la base de datos.' });
  }

  const data = await queryRes.json() as { results: NotionPage[] };

  if (data.results.length === 0) {
    return res.status(401).json({ ok: false, error: 'Cédula no registrada.' });
  }

  const page = data.results[0];
  const storedHash = page.properties['Password']?.rich_text?.[0]?.text?.content ?? '';

  if (storedHash !== password) {
    return res.status(401).json({ ok: false, error: 'Contraseña incorrecta.' });
  }

  return res.status(200).json({ ok: true, pageId: page.id, cedula: cedula.trim() });
}

// ── Tipos auxiliares ──────────────────────────────────────────────────────────
interface NotionPage {
  id: string;
  properties: {
    'Cedula': { title: Array<{ text: { content: string } }> };
    'Password': { rich_text: Array<{ text: { content: string } }> };
  };
}
