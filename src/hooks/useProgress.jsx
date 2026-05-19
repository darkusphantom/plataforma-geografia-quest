import { useState, useEffect } from 'react';

const STORAGE_KEY = 'geografia_progreso';

export function useProgress() {
  const [progress, setProgress] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar progreso desde localStorage al iniciar
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error('Error al cargar progreso de localStorage', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Función para guardar resultado de una actividad
  const saveActivityProgress = (moduloId, actividadId, respuestas, calificacion) => {
    setProgress(prev => {
      const newProgress = {
        ...prev,
        [moduloId]: {
          ...(prev[moduloId] || {}),
          [actividadId]: {
            respuestas,
            calificacion
          }
        }
      };
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      } catch (error) {
        console.error('Error al guardar progreso en localStorage', error);
      }
      
      return newProgress;
    });
  };

  // Obtener progreso de un módulo completo
  const getModuleProgress = (moduloId) => {
    return progress[moduloId] || null;
  };
  
  // Obtener progreso de una actividad específica
  const getActivityProgress = (moduloId, actividadId) => {
    if (!progress[moduloId]) return null;
    return progress[moduloId][actividadId] || null;
  };

  // Limpiar progreso (útil para pruebas)
  const clearProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress({});
  };

  return { 
    progress, 
    isLoaded,
    saveActivityProgress, 
    getModuleProgress, 
    getActivityProgress,
    clearProgress
  };
}
