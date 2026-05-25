import { useState, useCallback, useRef, useEffect } from 'react';
import { guardarRespuesta, obtenerRespuestasEstudiante } from '../services/notionService';

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Mapa de módulo ID → actividad ID → progreso */
type ProgressMap = Record<string, Record<string, { respuestas: Record<string, string>; calificacion: number }>>;

/**
 * Prefijo base de la clave de localStorage.
 * Se concatena con el ID del estudiante para aislar los datos por usuario.
 * @example 'geografia_progreso_abc123'
 */
const STORAGE_KEY_PREFIX = 'geografia_progreso';

/** Mapeo de módulo ID a nombre de select en Notion */
const MODULE_NAME_MAP: Record<string, string> = {
  '1-tectonica-placas': 'Tectónica de Placas',
  '2-volcanes-sismos': 'Volcanes y Mov. Sísmicos',
  '3-atmosfera-clima': 'Atmósfera y Clima',
  '4-ciclo-hidrologico': 'Ciclo Hidrológico',
};

// ── Helpers localStorage (fallback offline) ────────────────────────────────────

/**
 * Construye la clave de localStorage específica para el estudiante.
 * Si no hay studentPageId (sin sesión), usa la clave genérica para evitar
 * escrituras anónimas que contaminen sesiones futuras.
 *
 * @param studentPageId - ID del estudiante en Notion, o null.
 * @returns Clave de localStorage única por usuario.
 */
function buildStorageKey(studentPageId: string | null): string {
  return studentPageId
    ? `${STORAGE_KEY_PREFIX}_${studentPageId}`
    : `${STORAGE_KEY_PREFIX}_anonymous`;
}

/**
 * Lee el progreso del localStorage para un usuario específico.
 *
 * @param studentPageId - ID del estudiante en Notion, o null.
 * @returns ProgressMap del usuario, o mapa vacío si no hay datos.
 */
function loadFromStorage(studentPageId: string | null): ProgressMap {
  try {
    const raw = localStorage.getItem(buildStorageKey(studentPageId));
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

/**
 * Persiste el ProgressMap en localStorage bajo la clave del usuario.
 *
 * @param data - Mapa de progreso a guardar.
 * @param studentPageId - ID del estudiante en Notion, o null.
 */
function saveToStorage(data: ProgressMap, studentPageId: string | null): void {
  try {
    localStorage.setItem(buildStorageKey(studentPageId), JSON.stringify(data));
  } catch {
    console.warn('[useNotionProgress] localStorage no disponible — modo offline');
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook de progreso sincronizado con Notion.
 * - Aísla el localStorage por `studentPageId` para evitar contaminación de datos
 *   entre estudiantes que compartan el mismo equipo.
 * - Guarda en localStorage como fallback offline.
 * - Envía respuestas individuales a Notion en background.
 * - Requiere el pageId del estudiante autenticado.
 *
 * @param studentPageId - ID de la página del estudiante en Notion. null si no hay sesión.
 */
export function useNotionProgress(studentPageId: string | null) {
  /**
   * Inicializa el progress con los datos del usuario actual.
   * El lazy initializer de useState solo corre en el primer render;
   * para cambios de usuario usamos el efecto de abajo.
   */
  const [progress, setProgress] = useState<ProgressMap>(() => loadFromStorage(studentPageId));

  /**
   * Ref para detectar cuándo cambia el usuario sin depender del state.
   * Permite recargar el progreso desde localStorage cuando otro estudiante
   * inicia sesión en la misma máquina (sin recargar la página).
   */
  const prevStudentIdRef = useRef<string | null>(studentPageId);

  /**
   * Efecto: recarga el progreso desde localStorage cada vez que cambia
   * el studentPageId (cambio de sesión de usuario).
   */
  useEffect(() => {
    if (prevStudentIdRef.current !== studentPageId) {
      prevStudentIdRef.current = studentPageId;
      setProgress(loadFromStorage(studentPageId));
    }
  }, [studentPageId]);

  /**
   * Guarda el resultado de una actividad tanto en localStorage como en Notion.
   * Cada pregunta se guarda como un registro individual en Notion.
   *
   * @param moduloId - ID del módulo (ej: '1-tectonica-placas')
   * @param actividadId - ID de la actividad (ej: 'act-tectonica-1')
   * @param respuestas - Mapa de preguntaId → respuesta del estudiante
   * @param calificacion - Puntuación 0–100
   */
  const saveActivityProgress = useCallback(
    async (
      moduloId: string,
      actividadId: string,
      respuestas: Record<string, string>,
      calificacion: number
    ) => {
      // 1. Actualizar estado local y localStorage (fallback offline, aislado por usuario)
      setProgress((prev) => {
        const next: ProgressMap = {
          ...prev,
          [moduloId]: {
            ...(prev[moduloId] ?? {}),
            [actividadId]: { respuestas, calificacion },
          },
        };
        saveToStorage(next, studentPageId);
        return next;
      });

      // 2. Sincronizar con Notion en background (si hay sesión activa)
      if (!studentPageId) return;

      const moduloNombre = MODULE_NAME_MAP[moduloId] ?? moduloId;
      const puntosPorPregunta = calificacion / Object.keys(respuestas).length;

      const savePromises = Object.entries(respuestas).map(([preguntaId, respuesta]) =>
        guardarRespuesta({
          studentPageId,
          preguntaId,
          modulo: moduloNombre,
          respuesta,
          puntaje: Math.round(puntosPorPregunta),
        }).catch((err) => {
          // No bloquear la UI si Notion falla — el localStorage ya tiene el dato
          console.error(`[useNotionProgress] Error guardando ${preguntaId}:`, err);
        })
      );

      await Promise.allSettled(savePromises);
    },
    [studentPageId]
  );

  /**
   * Obtiene el progreso guardado de una actividad específica.
   */
  const getActivityProgress = useCallback(
    (moduloId: string, actividadId: string) => {
      return progress[moduloId]?.[actividadId] ?? null;
    },
    [progress]
  );

  /**
   * Obtiene el progreso de un módulo completo.
   */
  const getModuleProgress = useCallback(
    (moduloId: string) => progress[moduloId] ?? null,
    [progress]
  );

  /**
   * Limpia el progreso local (localStorage).
   * No afecta los registros ya guardados en Notion.
   */
  const clearProgress = useCallback(() => {
    localStorage.removeItem(buildStorageKey(studentPageId));
    setProgress({});
  }, [studentPageId]);

  return {
    progress,
    saveActivityProgress,
    getActivityProgress,
    getModuleProgress,
    clearProgress,
  };
}
