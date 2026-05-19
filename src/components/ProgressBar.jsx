export function ProgressBar({ progress, totalModules }) {
  // Contamos cuántos módulos tienen algún progreso guardado
  const completados = Object.keys(progress).length;
  const porcentaje = totalModules === 0 ? 0 : Math.round((completados / totalModules) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        <span>Progreso general</span>
        <span className="text-acento">{porcentaje}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div 
          className="bg-green-500 h-3 rounded-full transition-all duration-1000 relative"
          style={{ width: `${porcentaje}%` }}
        >
          {porcentaje > 0 && (
            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        {completados} de {totalModules} módulos completados
      </p>
    </div>
  );
}
