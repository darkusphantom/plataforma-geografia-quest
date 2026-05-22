import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/notion/get-answers?studentPageId=xxx
 * Obtiene todas las respuestas guardadas de un estudiante.
 *
 * @query {{ studentPageId: string }}
 * @returns {{ ok: true; answers: NotionAnswer[] } | { ok: false; error: string }}
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const { studentPageId } = req.query;

  if (!studentPageId || typeof studentPageId !== 'string') {
    return res.status(400).json({ ok: false, error: 'studentPageId es requerido.' });
  }

  const NOTION_KEY = process.env.NOTION_KEY!;
  const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
  const DB_ID = process.env.NOTION_DB_ANSWERS!;

  const queryRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      filter: {
        property: 'Estudiante',
        relation: { contains: studentPageId },
      },
    }),
  });

  if (!queryRes.ok) {
    const err = await queryRes.text();
    console.error('[get-answers] Notion query error:', err);
    return res.status(502).json({ ok: false, error: 'Error al consultar respuestas.' });
  }

  const data = await queryRes.json() as { results: RawNotionPage[] };

  const answers: NotionAnswer[] = data.results.map((page) => ({
    id: page.id,
    preguntaId: page.properties['Pregunta ID']?.title?.[0]?.text?.content ?? '',
    modulo: page.properties['Modulo']?.select?.name ?? '',
    respuesta: page.properties['Respuesta']?.rich_text?.[0]?.text?.content ?? '',
    puntaje: page.properties['Puntaje']?.number ?? 0,
    fecha: page.properties['Fecha']?.date?.start ?? '',
  }));

  return res.status(200).json({ ok: true, answers });
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface NotionAnswer {
  id: string;
  preguntaId: string;
  modulo: string;
  respuesta: string;
  puntaje: number;
  fecha: string;
}

interface RawNotionPage {
  id: string;
  properties: {
    'Pregunta ID': { title: Array<{ text: { content: string } }> };
    'Modulo': { select: { name: string } };
    'Respuesta': { rich_text: Array<{ text: { content: string } }> };
    'Puntaje': { number: number };
    'Fecha': { date: { start: string } };
  };
}
