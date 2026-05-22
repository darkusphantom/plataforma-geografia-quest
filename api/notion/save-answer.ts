import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseBody } from './utils';

/**
 * POST /api/notion/save-answer
 * Guarda la respuesta de un estudiante a una pregunta en Notion.
 *
 * @body {SaveAnswerPayload}
 * @returns {{ ok: true; pageId: string } | { ok: false; error: string }}
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const body = await parseBody(req);
  const { studentPageId, preguntaId, modulo, respuesta, puntaje } = body as any;

  if (!studentPageId || !preguntaId || !modulo || respuesta === undefined || puntaje === undefined) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });
  }

  const NOTION_KEY = process.env.NOTION_KEY;
  const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
  const DB_ID = process.env.NOTION_DB_ANSWERS;

  if (!NOTION_KEY || !DB_ID) {
    console.error('[save-answer] Faltan variables de entorno');
    return res.status(500).json({ ok: false, error: 'Configuración del servidor incompleta.' });
  }

  const createRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: DB_ID },
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

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('[save-answer] Notion create error:', err);
    return res.status(502).json({ ok: false, error: 'Error al guardar la respuesta.' });
  }

  const page = await createRes.json() as { id: string };
  return res.status(201).json({ ok: true, pageId: page.id });
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface SaveAnswerPayload {
  studentPageId: string;
  preguntaId: string;
  /** Nombre exacto del módulo como aparece en el select de Notion */
  modulo: string;
  respuesta: string | boolean;
  puntaje: number;
}
