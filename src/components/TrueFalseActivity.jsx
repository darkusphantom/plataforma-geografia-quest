import { useState } from 'react';
import { getFeedback } from '../utils/feedback';
import { ScoreCard } from './ScoreCard';

export function TrueFalseActivity({ questions, onSubmit, savedProgress, onSiguiente }) {

  const [respuestas, setRespuestas] = useState(savedProgress ? savedProgress.respuestas : {});
  const [resultado, setResultado] = useState(savedProgress ? { 
    puntaje: savedProgress.calificacion, 
    correctas: savedProgress.correctas,
    total: questions.length,
    ...getFeedback(savedProgress.calificacion) 
  } : null);

  const handleSelect = (id, valor) => {
    if (resultado) return; // No permitir cambios después de enviar
    setRespuestas(prev => ({
      ...prev,
      [id]: valor
    }));
  };

  const handleSubmit = () => {
    // Verificar si se respondieron todas las preguntas
    if (Object.keys(respuestas).length < questions.length) {
      alert("Por favor, responde todas las preguntas antes de enviar.");
      return;
    }

    let correctas = 0;
    
    questions.forEach(q => {
      if (respuestas[q.id] === q.respuestaCorrecta) {
        correctas++;
      }
    });

    const puntaje = Math.round((correctas / questions.length) * 100);
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
    <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-blue-50 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-green-50/30 p-4 sm:p-6 border-b border-blue-100">
        <h3 className="text-2xl sm:text-3xl font-bold text-textoBase mb-2 font-serif">Evaluación: Verdadero o Falso</h3>
        <p className="text-gray-600 font-medium">Selecciona la opción correcta para cada afirmación.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {questions.map((q, index) => {
          const seleccion = respuestas[q.id];
          const esCorrecta = resultado && seleccion === q.respuestaCorrecta;
          const esIncorrecta = resultado && seleccion !== q.respuestaCorrecta;

          return (
            <div key={q.id} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="font-semibold text-lg text-textoBase mb-5 leading-relaxed">
                <span className="text-acento mr-2">{index + 1}.</span>
                {q.pregunta}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleSelect(q.id, "verdadero")}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 border-2 active:scale-95
                    ${seleccion === "verdadero" 
                      ? 'border-acento bg-blue-50 text-acento shadow-inner' 
                      : 'border-slate-200 bg-white text-gray-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}
                    ${resultado && q.respuestaCorrecta === "verdadero" ? 'ring-2 ring-exito ring-offset-2 border-exito' : ''}
                  `}
                  disabled={!!resultado}
                >
                  Verdadero
                </button>
                
                <button
                  onClick={() => handleSelect(q.id, "falso")}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 border-2 active:scale-95
                    ${seleccion === "falso" 
                      ? 'border-acento bg-blue-50 text-acento shadow-inner' 
                      : 'border-slate-200 bg-white text-gray-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}
                    ${resultado && q.respuestaCorrecta === "falso" ? 'ring-2 ring-exito ring-offset-2 border-exito' : ''}
                  `}
                  disabled={!!resultado}
                >
                  Falso
                </button>
              </div>

              {/* Feedback específico por pregunta tras evaluar */}
              {resultado && (
                <div className={`mt-3 text-sm font-medium ${esCorrecta ? 'text-exito' : 'text-error'}`}>
                  {esCorrecta ? '✓ Respuesta correcta' : '✗ Respuesta incorrecta'}
                  {esIncorrecta && q.explicacion && (
                    <p className="text-gray-600 font-normal mt-1 block">
                      <span className="font-semibold text-gray-700">Explicación: </span>
                      {q.explicacion}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Botón de Enviar o Resultados */}
        {!resultado ? (
          <button 
            onClick={handleSubmit}
            disabled={Object.keys(respuestas).length < questions.length}
            className="w-full py-4 bg-acento hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-4 active:scale-95"
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
