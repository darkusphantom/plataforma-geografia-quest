/**
 * @fileoverview Servicio cliente para comunicarse con el proxy Notion (/api/notion/*).
 * En producción llama a las funciones serverless de Vercel.
 * En desarrollo llama al servidor Express local vía el proxy de Vite.
 *
 * @module notionService
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Datos de sesión del estudiante */
export interface Student {
  pageId: string;
  cedula: string;
}

/** Respuesta guardada de una actividad */
export interface NotionAnswer {
  id: string;
  preguntaId: string;
  modulo: string;
  respuesta: string;
  puntaje: number;
  fecha: string;
}

/** Payload para guardar una respuesta */
export interface SaveAnswerPayload {
  studentPageId: string;
  preguntaId: string;
  modulo: string;
  respuesta: string | boolean;
  puntaje: number;
}

// ── Implementación ────────────────────────────────────────────────────────────

const BASE = '/api/notion';

/**
 * Genera un hash SHA-256 en el cliente usando Web Crypto API.
 * Se usa para hashear la contraseña antes de enviarla al servidor.
 *
 * @param message - Texto plano a hashear
 * @returns Hex string del hash
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Autentica un estudiante por cédula y contraseña.
 * La contraseña se hashea en cliente antes de enviarse.
 *
 * @param cedula - Número de cédula del estudiante
 * @param password - Contraseña en texto plano (se hashea antes de enviar)
 * @returns Datos del estudiante autenticado
 * @throws {Error} Si las credenciales son inválidas o hay error de red
 */
export async function loginEstudiante(cedula: string, password: string): Promise<Student> {
  const hashedPassword = await sha256(password);

  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cedula: cedula.trim(), password: hashedPassword }),
  });

  const data = await res.json() as { ok: boolean; pageId?: string; cedula?: string; error?: string };

  if (!data.ok) throw new Error(data.error ?? 'Error de autenticación');

  return { pageId: data.pageId!, cedula: data.cedula! };
}

/**
 * Registra un nuevo estudiante con cédula y contraseña.
 * Previene duplicados. La contraseña se hashea en cliente.
 *
 * @param cedula - Número de cédula
 * @param password - Contraseña en texto plano (mínimo 4 caracteres)
 * @returns Datos del estudiante recién creado
 * @throws {Error} Si la cédula ya existe o los datos son inválidos
 */
export async function registrarEstudiante(cedula: string, password: string): Promise<Student> {
  const hashedPassword = await sha256(password);

  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cedula: cedula.trim(), password: hashedPassword }),
  });

  const data = await res.json() as { ok: boolean; pageId?: string; cedula?: string; error?: string };

  if (!data.ok) throw new Error(data.error ?? 'Error al registrar');

  return { pageId: data.pageId!, cedula: data.cedula! };
}

/**
 * Guarda la respuesta de un estudiante a una pregunta.
 *
 * @param payload - Datos de la respuesta a guardar
 * @throws {Error} Si el guardado falla
 */
export async function guardarRespuesta(payload: SaveAnswerPayload): Promise<void> {
  const res = await fetch(`${BASE}/save-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as { ok: boolean; error?: string };
  if (!data.ok) throw new Error(data.error ?? 'Error al guardar respuesta');
}

/**
 * Obtiene todas las respuestas guardadas de un estudiante.
 *
 * @param studentPageId - ID de la página del estudiante en Notion
 * @returns Array de respuestas guardadas
 * @throws {Error} Si la consulta falla
 */
export async function obtenerRespuestasEstudiante(studentPageId: string): Promise<NotionAnswer[]> {
  const res = await fetch(`${BASE}/get-answers?studentPageId=${encodeURIComponent(studentPageId)}`);

  const data = await res.json() as { ok: boolean; answers?: NotionAnswer[]; error?: string };
  if (!data.ok) throw new Error(data.error ?? 'Error al obtener respuestas');

  return data.answers ?? [];
}
