/**
 * Barra de progreso que muestra la nota acumulada del estudiante sobre la escala total.
 *
 * @param {Record<string, Record<string, { calificacion: number }>>} progress - Mapa de progreso por módulo.
 * @param {number} totalModules - Total de módulos del curso.
 */
export function ProgressBar({ progress, totalModules }) {
  const NOTA_MAXIMA = totalModules * 5; // 20 pts totales (4 módulos × 5 pts)
  const completados = Object.keys(progress).length;

  // Suma de las calificaciones obtenidas en cada módulo (primer actividad registrada)
  const notaAcumulada = Object.values(progress).reduce((sum, modulo) => {
    const actividad = Object.values(modulo)[0];
    return sum + (actividad?.calificacion ?? 0);
  }, 0);

  const notaDisplay = parseFloat(notaAcumulada.toFixed(2));
  const porcentaje =
    NOTA_MAXIMA === 0 ? 0 : Math.round((notaAcumulada / NOTA_MAXIMA) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        <span>Diario de Viaje</span>
        <span className="text-acento">
          {notaDisplay}/{NOTA_MAXIMA} pts
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="bg-linear-to-r from-acentoSecundario to-acento h-3 rounded-full transition-all duration-1000 relative"
          style={{ width: `${porcentaje}%` }}
        >
          {porcentaje > 0 && (
            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center font-medium">
        {completados} de {totalModules} exploraciones completadas
      </p>
    </div>
  );
}
