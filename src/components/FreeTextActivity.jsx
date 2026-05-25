import { useState } from "react";
import { getFeedback } from "../utils/feedback";
import { evaluarRespuesta } from "../utils/evaluation";
import { ScoreCard } from "./ScoreCard";

export function FreeTextActivity({
  questions,
  onSubmit,
  savedProgress,
  onSiguiente,
}) {
  const [respuestas, setRespuestas] = useState(
    savedProgress ? savedProgress.respuestas : {},
  );
  const [resultado, setResultado] = useState(
    savedProgress
      ? {
          puntaje: savedProgress.calificacion,
          correctas: savedProgress.correctas,
          total: questions.length,
          ...getFeedback(savedProgress.calificacion),
        }
      : null,
  );

  const handleInput = (id, valor) => {
    if (resultado) return;
    setRespuestas((prev) => ({
      ...prev,
      [id]: valor,
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(respuestas).length < questions.length) {
      alert("Por favor, responde todas las preguntas antes de enviar.");
      return;
    }

    let puntosTotales = 0;
    let correctas = 0;

    questions.forEach((q) => {
      const respUsuario = respuestas[q.id] || "";
      const ev = evaluarRespuesta(respUsuario, q.respuestasEsperadas);
      if (ev.esCorrecta) {
        correctas++;
        puntosTotales += q.puntos ?? 5 / questions.length;
      }
    });

    const puntaje = parseFloat(Math.min(5, puntosTotales).toFixed(2));
    const feedback = getFeedback(puntaje);
    const nuevoResultado = {
      puntaje,
      correctas,
      total: questions.length,
      ...feedback,
    };

    setResultado(nuevoResultado);

    if (onSubmit) {
      onSubmit({
        respuestas,
        calificacion: puntaje,
        correctas,
        total: questions.length,
      });
    }
  };

  const handleReintentar = () => {
    setRespuestas({});
    setResultado(null);
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-blue-50 overflow-hidden">
      <div className="bg-linear-to-r from-blue-50 to-green-50/30 p-4 sm:p-6 border-b border-blue-100">
        <h3 className="text-2xl sm:text-3xl font-bold text-textoBase mb-2 font-serif">
          Evaluación: Respuesta Libre
        </h3>
        <p className="text-gray-600 font-medium">
          Escribe tu respuesta con tus propias palabras para cada pregunta.
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {questions.map((q, index) => {
          const seleccion = respuestas[q.id] || "";
          const esCorrecta =
            resultado &&
            evaluarRespuesta(seleccion, q.respuestasEsperadas).esCorrecta;

          return (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <p className="font-semibold text-lg text-textoBase mb-4 leading-relaxed">
                <span className="text-acento mr-2">{index + 1}.</span>
                {q.pregunta}
              </p>

              <textarea
                rows="3"
                className={`w-full p-4 rounded-xl border-2 focus:ring-0 focus:border-acento outline-none resize-none transition-all duration-300 font-medium ${resultado ? "bg-slate-50 cursor-not-allowed border-slate-200" : "bg-white border-slate-200 hover:border-slate-300 shadow-inner"}`}
                placeholder="Escribe tu respuesta aquí..."
                value={seleccion}
                onChange={(e) => handleInput(q.id, e.target.value)}
                disabled={!!resultado}
              ></textarea>

              {resultado && (
                <div
                  className={`mt-3 text-sm font-medium ${esCorrecta ? "text-exito" : "text-error"}`}
                >
                  {esCorrecta
                    ? "✓ Buen trabajo"
                    : "✗ La respuesta no incluye los conceptos clave esperados."}
                  {!esCorrecta && (
                    <p className="text-gray-600 font-normal mt-1 block">
                      <span className="font-semibold text-gray-700">
                        Conceptos esperados:{" "}
                      </span>
                      {q.respuestasEsperadas.join(", ")}
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
            disabled={
              Object.keys(respuestas).length < questions.length ||
              Object.values(respuestas).some((r) => r.trim() === "")
            }
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
