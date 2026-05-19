import { getFeedback } from '../utils/feedback';

export function ScoreCard({ 
  calificacion, 
  totalPreguntas, 
  respuestasCorrectas, 
  onRepetir, 
  onSiguiente 
}) {
  const feedback = getFeedback(calificacion);

  return (
    <div className={`mt-6 p-6 sm:p-8 rounded-xl border-2 text-center animate-fade-in shadow-sm ${feedback.color}`}>
      <div className="text-6xl sm:text-7xl mb-4">{feedback.emoji}</div>
      <h4 className="text-3xl sm:text-4xl font-extrabold mb-2 text-gray-900 drop-shadow-sm">
        {calificacion}/100
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
