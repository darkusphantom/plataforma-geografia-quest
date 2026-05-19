import { useState } from 'react';
import { getFeedback } from '../utils/feedback';
import { ScoreCard } from './ScoreCard';

export function MatchingActivity({ pares, onSubmit, savedProgress, onSiguiente }) {
  const [respuestas, setRespuestas] = useState(savedProgress ? savedProgress.respuestas : {});
  const [resultado, setResultado] = useState(savedProgress ? { 
    puntaje: savedProgress.calificacion, 
    correctas: savedProgress.correctas,
    total: pares.length,
    ...getFeedback(savedProgress.calificacion) 
  } : null);

  const handleSelect = (id, indexOpcion) => {
    if (resultado) return;
    setRespuestas(prev => ({
      ...prev,
      [id]: indexOpcion
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(respuestas).length < pares.length) {
      alert("Por favor, selecciona una opción para todos los conceptos.");
      return;
    }

    let puntosTotales = 0;
    let correctas = 0;
    
    pares.forEach(p => {
      if (respuestas[p.id] === p.respuestaCorrecta) {
        correctas++;
        puntosTotales += p.puntos || (100 / pares.length);
      }
    });

    const puntaje = Math.min(100, Math.round(puntosTotales));
    const feedback = getFeedback(puntaje);
    const nuevoResultado = { puntaje, correctas, total: pares.length, ...feedback };
    
    setResultado(nuevoResultado);

    if (onSubmit) {
      onSubmit({ respuestas, calificacion: puntaje, correctas, total: pares.length });
    }
  };

  const handleReintentar = () => {
    setRespuestas({});
    setResultado(null);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50/50 p-4 sm:p-6 border-b border-gray-100">
        <h3 className="text-xl sm:text-2xl font-bold text-textoBase mb-2">Evaluación: Relaciona Conceptos</h3>
        <p className="text-gray-600">Selecciona la definición correcta para cada concepto.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {pares.map((p, index) => {
          const seleccion = respuestas[p.id];
          const esCorrecta = resultado && seleccion === p.respuestaCorrecta;

          return (
            <div key={p.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="md:w-1/3">
                <p className="font-semibold text-lg text-textoBase">
                  <span className="text-acento mr-2">{index + 1}.</span>
                  {p.concepto}
                </p>
              </div>
              
              <div className="md:w-2/3">
                <select
                  value={seleccion !== undefined ? seleccion : ""}
                  onChange={(e) => handleSelect(p.id, parseInt(e.target.value))}
                  disabled={!!resultado}
                  className={`w-full p-3 rounded-lg border outline-none cursor-pointer appearance-none ${resultado ? (esCorrecta ? 'bg-green-50 border-exito text-exito' : 'bg-red-50 border-error text-error') : 'bg-white border-gray-300 focus:ring-2 focus:ring-acento focus:border-acento'}`}
                >
                  <option value="" disabled>-- Selecciona una definición --</option>
                  {p.opciones.map((opcion, idx) => (
                    <option key={idx} value={idx}>{opcion}</option>
                  ))}
                </select>
                
                {resultado && !esCorrecta && (
                  <p className="text-sm font-medium text-error mt-2">
                    La definición correcta era: <span className="font-semibold">{p.opciones[p.respuestaCorrecta]}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {!resultado ? (
          <button 
            onClick={handleSubmit}
            disabled={Object.keys(respuestas).length < pares.length}
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
