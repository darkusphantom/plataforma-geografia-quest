import { useState } from 'react';
import { getFeedback } from '../utils/feedback';
import { evaluarRespuesta } from '../utils/evaluation';
import { ScoreCard } from './ScoreCard';

export function FreeTextActivity({ questions, onSubmit, savedProgress, onSiguiente }) {
  const [respuestas, setRespuestas] = useState(savedProgress ? savedProgress.respuestas : {});
  const [resultado, setResultado] = useState(savedProgress ? { 
    puntaje: savedProgress.calificacion, 
    correctas: savedProgress.correctas,
    total: questions.length,
    ...getFeedback(savedProgress.calificacion) 
  } : null);

  const handleInput = (id, valor) => {
    if (resultado) return;
    setRespuestas(prev => ({
      ...prev,
      [id]: valor
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(respuestas).length < questions.length) {
      alert("Por favor, responde todas las preguntas antes de enviar.");
      return;
    }

    let puntosTotales = 0;
    let correctas = 0;
    
    questions.forEach(q => {
      const respUsuario = respuestas[q.id] || "";
      const ev = evaluarRespuesta(respUsuario, q.respuestasEsperadas);
      if (ev.esCorrecta) {
        correctas++;
        puntosTotales += q.puntos || (100 / questions.length);
      }
    });

    const puntaje = Math.min(100, Math.round(puntosTotales));
    const feedback = getFeedback(puntaje);
    const nuevoResultado = { puntaje, correctas, total: questions.length, ...feedback };
    
    setResultado(nuevoResultado);

    if (onSubmit) {
      onSubmit({ respuestas, calificacion: puntaje, correctas, total: questions.length });
    }
  };

  const handleReintentar = () => {
    setRespuestas({});
    setResultado(null);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50/50 p-4 sm:p-6 border-b border-gray-100">
        <h3 className="text-xl sm:text-2xl font-bold text-textoBase mb-2">Evaluación: Respuesta Libre</h3>
        <p className="text-gray-600">Escribe tu respuesta con tus propias palabras para cada pregunta.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {questions.map((q, index) => {
          const seleccion = respuestas[q.id] || "";
          const esCorrecta = resultado && evaluarRespuesta(seleccion, q.respuestasEsperadas).esCorrecta;

          return (
            <div key={q.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="font-semibold text-lg text-textoBase mb-4">
                <span className="text-acento mr-2">{index + 1}.</span>
                {q.pregunta}
              </p>
              
              <textarea
                rows="3"
                className={`w-full p-4 rounded-lg border focus:ring-2 focus:ring-acento focus:border-acento outline-none resize-none transition-colors ${resultado ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-gray-300'}`}
                placeholder="Escribe tu respuesta aquí..."
                value={seleccion}
                onChange={(e) => handleInput(q.id, e.target.value)}
                disabled={!!resultado}
              ></textarea>

              {resultado && (
                <div className={`mt-3 text-sm font-medium ${esCorrecta ? 'text-exito' : 'text-error'}`}>
                  {esCorrecta ? '✓ Buen trabajo' : '✗ La respuesta no incluye los conceptos clave esperados.'}
                  {!esCorrecta && (
                    <p className="text-gray-600 font-normal mt-1 block">
                      <span className="font-semibold text-gray-700">Conceptos esperados: </span>
                      {q.respuestasEsperadas.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!resultado ? (
          <button 
            onClick={handleSubmit}
            disabled={Object.keys(respuestas).length < questions.length || Object.values(respuestas).some(r => r.trim() === '')}
            className="w-full py-4 bg-acento hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-4"
          >
            Evaluar mis respuestas
          </button>
        ) : (
          <ScoreCard 
            calificacion={resultado.puntaje}
            totalPreguntas={resultado.total}
            respuestasCorrectas={resultado.correctas}
            onRepetir={handleReintentar}
            onSiguiente={onSiguiente}
          />
        )}
      </div>
    </div>
  );
}
