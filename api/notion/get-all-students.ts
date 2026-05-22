import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/notion/get-all-students
 * Devuelve todos los estudiantes registrados (cédula + pageId).
 * Uso exclusivo del panel de administrador.
 *
 * @returns {{ ok: true; students: StudentSummary[] } | { ok: false; error: string }}
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const NOTION_KEY = process.env.NOTION_KEY!;
  const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
  const DB_ID = process.env.NOTION_DB_STUDENTS!;

  const queryRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({ page_size: 100 }),
  });

  if (!queryRes.ok) {
    const err = await queryRes.text();
    console.error('[get-all-students] Notion error:', err);
    return res.status(502).json({ ok: false, error: 'Error al consultar estudiantes.' });
  }

  const data = await queryRes.json() as { results: RawStudentPage[] };

  const students: StudentSummary[] = data.results.map((page) => ({
    pageId: page.id,
    cedula: page.properties['Cedula']?.title?.[0]?.text?.content ?? '',
  }));

  return res.status(200).json({ ok: true, students });
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface StudentSummary {
  pageId: string;
  cedula: string;
}

interface RawStudentPage {
  id: string;
  properties: {
    'Cedula': { title: Array<{ text: { content: string } }> };
  };
}
