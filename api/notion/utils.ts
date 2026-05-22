import type { VercelRequest } from '@vercel/node';
import { createHash } from 'crypto';

/**
 * Genera un hash SHA-256 de un string (para contraseñas).
 * @param value - Texto plano a hashear
 * @returns Hash hex de 64 caracteres
 */
export function sha256Hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Parsea el body de una VercelRequest de forma segura.
 * Soporta tanto body pre-parseado por Vercel como raw string/buffer.
 *
 * @param req - VercelRequest
 * @returns Objeto JSON del body
 * @throws {Error} Si el body no puede parsearse
 */
export async function parseBody(req: VercelRequest): Promise<Record<string, unknown>> {
  // Vercel auto-parsea el body si Content-Type es application/json
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }

  // Fallback: leer el raw body como string
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new Error('Body inválido: no es JSON válido.');
    }
  }

  return {};
}

/**
 * Headers CORS estándar para todas las funciones serverless.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;
