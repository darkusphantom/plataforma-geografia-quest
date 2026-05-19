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
    <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-blue-50 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-green-50/30 p-4 sm:p-6 border-b border-blue-100">
        <h3 className="text-2xl sm:text-3xl font-bold text-textoBase mb-2 font-serif">Evaluación: Relaciona Conceptos</h3>
        <p className="text-gray-600 font-medium">Selecciona la definición correcta para cada concepto.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {pares.map((p, index) => {
          const seleccion = respuestas[p.id];
          const esCorrecta = resultado && seleccion === p.respuestaCorrecta;

          return (
            <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="md:w-1/3">
                <p className="font-semibold text-lg text-textoBase leading-tight">
                  <span className="text-acento mr-2">{index + 1}.</span>
                  {p.concepto}
                </p>
              </div>
              
              <div className="md:w-2/3">
                <select
                  value={seleccion !== undefined ? seleccion : ""}
                  onChange={(e) => handleSelect(p.id, parseInt(e.target.value))}
                  disabled={!!resultado}
                  className={`w-full p-4 rounded-xl border-2 outline-none cursor-pointer transition-all duration-300 font-medium appearance-none ${resultado ? (esCorrecta ? 'bg-green-50 border-exito text-exito' : 'bg-red-50 border-error text-error') : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm focus:border-acento focus:ring-0 text-slate-700'}`}
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
