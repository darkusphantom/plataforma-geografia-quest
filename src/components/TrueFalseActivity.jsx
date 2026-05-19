import { useState } from 'react';

export function TrueFalseActivity({ questions, onSubmit, savedProgress }) {
  const getFeedback = (puntaje) => {
    if (puntaje >= 80) return { emoji: "✅", mensaje: "¡Excelente! Lo lograste", color: "text-exito bg-green-50 border-exito" };
    if (puntaje >= 50) return { emoji: "😊", mensaje: "Sigue adelante, lo puedes hacer mejor", color: "text-advertencia bg-yellow-50 border-advertencia" };
    return { emoji: "❌", mensaje: "Intenta de nuevo", color: "text-error bg-red-50 border-error" };
  };

  const [respuestas, setRespuestas] = useState(savedProgress ? savedProgress.respuestas : {});
  const [resultado, setResultado] = useState(savedProgress ? { 
    puntaje: savedProgress.calificacion, 
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

    const nuevoResultado = { puntaje, ...feedback };
    setResultado(nuevoResultado);

    if (onSubmit) {
      onSubmit({ respuestas, calificacion: puntaje });
    }
  };

  const handleReintentar = () => {
    setRespuestas({});
    setResultado(null);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50/50 p-4 sm:p-6 border-b border-gray-100">
        <h3 className="text-xl sm:text-2xl font-bold text-textoBase mb-2">Evaluación: Verdadero o Falso</h3>
        <p className="text-gray-600">Lee cuidadosamente cada afirmación y selecciona la opción correcta.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {questions.map((q, index) => {
          const seleccion = respuestas[q.id];
          const esCorrecta = resultado && seleccion === q.respuestaCorrecta;
          const esIncorrecta = resultado && seleccion !== q.respuestaCorrecta;

          return (
            <div key={q.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="font-semibold text-lg text-textoBase mb-4">
                <span className="text-acento mr-2">{index + 1}.</span>
                {q.afirmacion}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleSelect(q.id, "verdadero")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 border-2 
                    ${seleccion === "verdadero" 
                      ? 'border-acento bg-blue-50 text-acento' 
                      : 'border-transparent bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}
                    ${resultado && q.respuestaCorrecta === "verdadero" ? 'ring-2 ring-exito ring-offset-1' : ''}
                  `}
                  disabled={!!resultado}
                >
                  Verdadero
                </button>
                
                <button
                  onClick={() => handleSelect(q.id, "falso")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 border-2 
                    ${seleccion === "falso" 
                      ? 'border-acento bg-blue-50 text-acento' 
                      : 'border-transparent bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}
                    ${resultado && q.respuestaCorrecta === "falso" ? 'ring-2 ring-exito ring-offset-1' : ''}
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
            className="w-full py-4 bg-acento hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-4"
          >
            Evaluar mis respuestas
          </button>
        ) : (
          <div className={`mt-6 p-6 rounded-xl border-2 text-center animate-fade-in ${resultado.color}`}>
            <div className="text-5xl mb-3">{resultado.emoji}</div>
            <h4 className="text-2xl font-bold mb-1">Tu puntuación: {resultado.puntaje}/100</h4>
            <p className="text-lg opacity-90 font-medium mb-4">{resultado.mensaje}</p>
            
            <button 
              onClick={handleReintentar}
              className="bg-white/80 hover:bg-white text-gray-800 font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
