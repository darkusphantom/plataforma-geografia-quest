import { useState, useCallback } from 'react';
import { guardarRespuesta, obtenerRespuestasEstudiante } from '../services/notionService';

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Mapa de módulo ID → actividad ID → progreso */
type ProgressMap = Record<string, Record<string, { respuestas: Record<string, string>; calificacion: number }>>;

const STORAGE_KEY = 'geografia_progreso';

/** Mapeo de módulo ID a nombre de select en Notion */
const MODULE_NAME_MAP: Record<string, string> = {
  '1-tectonica-placas': 'Tectónica de Placas',
  '2-volcanes-sismos': 'Volcanes y Mov. Sísmicos',
  '3-atmosfera-clima': 'Atmósfera y Clima',
  '4-ciclo-hidrologico': 'Ciclo Hidrológico',
};

// ── Helpers localStorage (fallback offline) ────────────────────────────────────

function loadFromStorage(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveToStorage(data: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[useNotionProgress] localStorage no disponible — modo offline');
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook de progreso sincronizado con Notion.
 * - Guarda en localStorage como fallback offline (consistente con el hook original).
 * - Envía respuestas individuales a Notion en background.
 * - Requiere el pageId del estudiante autenticado.
 *
 * @param studentPageId - ID de la página del estudiante en Notion. null si no hay sesión.
 */
export function useNotionProgress(studentPageId: string | null) {
  const [progress, setProgress] = useState<ProgressMap>(loadFromStorage);

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
      // 1. Actualizar estado local y localStorage (fallback offline)
      setProgress((prev) => {
        const next: ProgressMap = {
          ...prev,
          [moduloId]: {
            ...(prev[moduloId] ?? {}),
            [actividadId]: { respuestas, calificacion },
          },
        };
        saveToStorage(next);
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
    localStorage.removeItem(STORAGE_KEY);
    setProgress({});
  }, []);

  return {
    progress,
    saveActivityProgress,
    getActivityProgress,
    getModuleProgress,
    clearProgress,
  };
}
