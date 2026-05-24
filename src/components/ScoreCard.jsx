import { getFeedback } from '../utils/feedback';

/**
 * Tarjeta de calificación final mostrada al completar una actividad.
 *
 * @param {number} calificacion - Puntaje obtenido (escala del módulo, p. ej. 0–5).
 * @param {number} [puntajeMaximo=5] - Puntaje máximo posible del módulo.
 * @param {number} totalPreguntas - Total de preguntas de la actividad.
 * @param {number} respuestasCorrectas - Número de respuestas correctas.
 * @param {Function} onRepetir - Callback para reintentar la actividad.
 * @param {Function} [onSiguiente] - Callback para avanzar al siguiente módulo.
 */
export function ScoreCard({ 
  calificacion, 
  puntajeMaximo = 5,
  totalPreguntas, 
  respuestasCorrectas, 
  onRepetir, 
  onSiguiente 
}) {
  const feedback = getFeedback(calificacion, puntajeMaximo);

  return (
    <div className={`mt-6 p-6 sm:p-8 rounded-xl border-2 text-center animate-fade-in shadow-sm ${feedback.color}`}>
      <div className="text-6xl sm:text-7xl mb-4">{feedback.emoji}</div>
      <h4 className="text-3xl sm:text-4xl font-extrabold mb-2 text-gray-900 drop-shadow-sm">
        {parseFloat(calificacion.toFixed(2))}/{puntajeMaximo} <span className="text-lg font-semibold text-gray-500">pts</span>
      </h4>
      
      {totalPreguntas !== undefined && respuestasCorrectas !== undefined && (
        <p className="text-gray-700 font-medium mb-2 text-lg">
          Respondiste correctamente <span className="font-bold">{respuestasCorrectas}</span> de <span className="font-bold">{totalPreguntas}</span> preguntas.
        </p>
      )}
      
      <p className="text-xl sm:text-2xl opacity-90 font-bold mb-8">{feedback.mensaje}</p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button 
          onClick={onRepetir}
          className="bg-white/90 hover:bg-white text-gray-800 font-bold py-3 px-6 rounded-lg shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 active:scale-95"
        >
          ↻ Repetir actividad
        </button>
        
        {onSiguiente && (
          <button 
            onClick={onSiguiente}
            className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 active:scale-95"
          >
            Siguiente módulo ➔
          </button>
        )}
      </div>
    </div>
  );
}
