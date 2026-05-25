import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const GRID_SIZE = 10;

/**
 * @component CrosswordActivity
 * @description Actividad interactiva de crucigrama.
 * Implementa un crucigrama con layout estático y validación de palabras.
 * Adaptado para mobile-first y accesibilidad.
 */
export function CrosswordActivity({ palabras, titulo, instruccion, onComplete, savedProgress }) {
  // ─── Preparación de la Grilla ───────────────────────────────────────────
  const { gridMap, wordData } = useMemo(() => {
    const map = {};
    const words = [];

    palabras.forEach((w) => {
      let r = w.fila;
      let c = w.col;
      const dir = w.direccion;
      
      words.push({ ...w, length: w.palabra.length });
      
      for (let i = 0; i < w.palabra.length; i++) {
        const key = `${r},${c}`;
        if (!map[key]) {
          map[key] = {
            row: r,
            col: c,
            correct: w.palabra[i],
            number: i === 0 ? w.id : null,
            words: []
          };
        } else if (i === 0 && !map[key].number) {
          // Por si intersectan dos inicios
          map[key].number = w.id;
        }
        map[key].words.push({ id: w.id, dir, index: i });
        
        if (dir === 'derecha') c++;
        else if (dir === 'abajo') r++;
      }
    });
    return { gridMap: map, wordData: words };
  }, [palabras]);

  // ─── Estado Interno ───────────────────────────────────────────────────
  // Si hay progreso guardado, lo restauramos
  const initialState = savedProgress?.respuestas || {};
  const [inputs, setInputs] = useState(initialState);
  
  const [enviado, setEnviado] = useState(!!savedProgress);
  const [scoreFinal, setScoreFinal] = useState(savedProgress?.calificacion ?? null);
  
  const [activeDirection, setActiveDirection] = useState('derecha'); // 'derecha' | 'abajo'
  const [focusedCell, setFocusedCell] = useState(null);

  const inputsRef = useRef({});
  const lastReportedScoreRef = useRef(savedProgress?.calificacion ?? null);

  // Efecto para limpiar estado al cambiar usuario
  useEffect(() => {
    if (!savedProgress) {
      setInputs({});
      setEnviado(false);
      setScoreFinal(null);
      lastReportedScoreRef.current = null;
    } else {
      lastReportedScoreRef.current = savedProgress.calificacion;
      setInputs(savedProgress.respuestas || {});
      setEnviado(true);
      setScoreFinal(savedProgress.calificacion);
    }
  }, [savedProgress]);

  // Llama a onComplete
  useEffect(() => {
    if (enviado && scoreFinal !== null && lastReportedScoreRef.current !== scoreFinal) {
      lastReportedScoreRef.current = scoreFinal;
      onComplete(scoreFinal, inputs);
    }
  }, [enviado, scoreFinal, onComplete, inputs]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const getNextCell = useCallback((r, c, dir, avance = 1) => {
    let nextR = r;
    let nextC = c;
    if (dir === 'derecha') nextC += avance;
    else nextR += avance;
    return `${nextR},${nextC}`;
  }, []);

  const handleChange = (r, c, val) => {
    if (enviado) return;
    const char = val.slice(-1).toUpperCase(); // Tomar la última letra ingresada
    
    // Si no es una letra (por ej espacio), ignorar
    if (char && !/^[A-ZÑÁÉÍÓÚ]$/.test(char)) return;

    setInputs((prev) => ({ ...prev, [`${r},${c}`]: char }));

    if (char) {
      // Auto-avanzar
      const cellData = gridMap[`${r},${c}`];
      // Si la celda pertenece a ambas direcciones, intentamos usar activeDirection.
      // Si no, usamos la dirección de la palabra a la que pertenece.
      let dir = activeDirection;
      const cellDirs = cellData.words.map(w => w.dir);
      if (!cellDirs.includes(dir)) {
        dir = cellDirs[0];
      }
      
      const nextKey = getNextCell(r, c, dir, 1);
      if (gridMap[nextKey]) {
        inputsRef.current[nextKey]?.focus();
      }
    }
  };

  const handleKeyDown = (r, c, e) => {
    if (enviado) return;
    
    const cellData = gridMap[`${r},${c}`];
    let dir = activeDirection;
    const cellDirs = cellData.words.map(w => w.dir);
    if (!cellDirs.includes(dir)) {
      dir = cellDirs[0];
    }

    if (e.key === 'Backspace') {
      if (!inputs[`${r},${c}`]) {
        // Retroceder si está vacía
        e.preventDefault();
        const prevKey = getNextCell(r, c, dir, -1);
        if (gridMap[prevKey]) {
          inputsRef.current[prevKey]?.focus();
          // Opcional: borrar la celda anterior al retroceder
          // setInputs(prev => ({ ...prev, [prevKey]: "" }));
        }
      } else {
        // Borrar celda actual (manejado por onChange normalmente, pero forzamos por si acaso)
        setInputs((prev) => ({ ...prev, [`${r},${c}`]: "" }));
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveDirection('derecha');
      if (gridMap[`${r},${c+1}`]) inputsRef.current[`${r},${c+1}`]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveDirection('derecha');
      if (gridMap[`${r},${c-1}`]) inputsRef.current[`${r},${c-1}`]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveDirection('abajo');
      if (gridMap[`${r+1},${c}`]) inputsRef.current[`${r+1},${c}`]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveDirection('abajo');
      if (gridMap[`${r-1},${c}`]) inputsRef.current[`${r-1},${c}`]?.focus();
    } else if (e.key === ' ') {
      // Toggle dirección
      e.preventDefault();
      if (cellDirs.length > 1) {
        setActiveDirection(prev => prev === 'derecha' ? 'abajo' : 'derecha');
      }
    }
  };

  const handleFocus = (r, c) => {
    setFocusedCell(`${r},${c}`);
    const cellData = gridMap[`${r},${c}`];
    const cellDirs = cellData.words.map(w => w.dir);
    if (!cellDirs.includes(activeDirection)) {
      setActiveDirection(cellDirs[0]);
    }
  };

  const handleVerificar = () => {
    // Calcular score. Cada letra correcta = puntos. O podemos evaluar por palabra.
    let correctWords = 0;
    wordData.forEach(w => {
      let isWordCorrect = true;
      let currR = w.fila;
      let currC = w.col;
      for (let i = 0; i < w.length; i++) {
        const val = inputs[`${currR},${currC}`] || "";
        if (val !== w.palabra[i]) {
          isWordCorrect = false;
          break;
        }
        if (w.direccion === 'derecha') currC++;
        else currR++;
      }
      if (isWordCorrect) correctWords++;
    });

    const score = Math.round((correctWords / wordData.length) * 100);
    setScoreFinal(score);
    setEnviado(true);
  };

  const handleReset = () => {
    setInputs({});
    setEnviado(false);
    setScoreFinal(null);
    lastReportedScoreRef.current = null;
  };

  // ─── Sub-Componentes Visuales ─────────────────────────────────────────

  const isWordHighlighted = (w) => {
    if (!focusedCell) return false;
    const [fr, fc] = focusedCell.split(',').map(Number);
    const cellData = gridMap[focusedCell];
    if (!cellData) return false;
    // Highlight si la palabra incluye la celda enfocada y coincide con la dirección activa
    return cellData.words.some(cw => cw.id === w.id && cw.dir === activeDirection);
  };

  // Calcular palabras encontradas para mostrar en verde si ya se envió
  const isWordCorrect = (w) => {
    if (!enviado) return false;
    let currR = w.fila;
    let currC = w.col;
    for (let i = 0; i < w.length; i++) {
      if (inputs[`${currR},${currC}`] !== w.palabra[i]) return false;
      if (w.direccion === 'derecha') currC++;
      else currR++;
    }
    return true;
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-blue-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/40 p-4 sm:p-6 border-b border-blue-100">
        <h3 className="text-xl sm:text-2xl font-bold text-textoBase mb-1 font-serif">
          {titulo}
        </h3>
        <p className="text-gray-600 font-medium text-sm">{instruccion}</p>
      </div>

      <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-8">
        
        {/* Grilla */}
        <div className="flex-1 overflow-x-auto touch-pan-x pb-4 lg:pb-0 flex justify-center items-start">
          <div 
            className="inline-grid gap-[1px] sm:gap-[2px] bg-slate-200 border-2 border-slate-300 p-[2px] rounded-lg shadow-inner"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(30px, 40px))` }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const r = Math.floor(idx / GRID_SIZE);
              const c = idx % GRID_SIZE;
              const key = `${r},${c}`;
              const cellData = gridMap[key];

              if (!cellData) {
                // Celda vacía (bloque negro o transparente)
                return <div key={key} className="w-full aspect-square bg-transparent"></div>;
              }

              // Estilos condicionales
              let bgClass = "bg-white";
              let textClass = "text-textoBase";
              let borderClass = "border-transparent";

              const isActiveWord = cellData.words.some(w => w.dir === activeDirection && isWordHighlighted(wordData.find(wd => wd.id === w.id)));
              const isCorrectCell = enviado && inputs[key] === cellData.correct;
              const isWrongCell = enviado && inputs[key] && inputs[key] !== cellData.correct;

              if (focusedCell === key) {
                bgClass = "bg-amber-200";
              } else if (isActiveWord && !enviado) {
                bgClass = "bg-amber-50";
              }

              if (isCorrectCell) {
                bgClass = "bg-emerald-100";
                textClass = "text-emerald-800 font-bold";
              } else if (isWrongCell) {
                bgClass = "bg-rose-100";
                textClass = "text-rose-800";
              }

              return (
                <div key={key} className={`relative w-full aspect-square ${bgClass} ${borderClass} transition-colors duration-200`}>
                  {cellData.number && (
                    <span className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-bold text-slate-500 z-10 pointer-events-none select-none">
                      {cellData.number}
                    </span>
                  )}
                  <input
                    ref={(el) => (inputsRef.current[key] = el)}
                    type="text"
                    maxLength={1}
                    value={inputs[key] || ""}
                    onChange={(e) => handleChange(r, c, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(r, c, e)}
                    onFocus={() => handleFocus(r, c)}
                    disabled={enviado}
                    className={`w-full h-full text-center font-bold text-sm sm:text-lg uppercase bg-transparent outline-none focus:ring-2 focus:ring-inset focus:ring-acento rounded-[2px] sm:rounded cursor-text ${textClass}`}
                    aria-label={`Celda fila ${r+1} columna ${c+1}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral: Pistas y Botón */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            
            {/* Pistas Horizontales */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-2 border-b pb-1">Horizontales</h4>
              <ul className="space-y-2">
                {wordData.filter(w => w.direccion === 'derecha').map(w => {
                  const correct = isWordCorrect(w);
                  return (
                    <li 
                      key={w.id} 
                      className={`text-sm p-2 rounded transition-colors ${isWordHighlighted(w) && !enviado ? 'bg-amber-50 border-l-2 border-amber-400' : 'border-l-2 border-transparent'} ${correct ? 'text-emerald-700 bg-emerald-50 line-through opacity-80' : 'text-slate-700'}`}
                    >
                      <span className="font-bold mr-1">{w.id}.</span> {w.pista}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Pistas Verticales */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-2 border-b pb-1 mt-2">Verticales</h4>
              <ul className="space-y-2">
                {wordData.filter(w => w.direccion === 'abajo').map(w => {
                  const correct = isWordCorrect(w);
                  return (
                    <li 
                      key={w.id} 
                      className={`text-sm p-2 rounded transition-colors ${isWordHighlighted(w) && !enviado ? 'bg-amber-50 border-l-2 border-amber-400' : 'border-l-2 border-transparent'} ${correct ? 'text-emerald-700 bg-emerald-50 line-through opacity-80' : 'text-slate-700'}`}
                    >
                      <span className="font-bold mr-1">{w.id}.</span> {w.pista}
                    </li>
                  )
                })}
              </ul>
            </div>
            
          </div>

          {!enviado ? (
            <button
              onClick={handleVerificar}
              className="mt-auto w-full py-3 px-4 bg-acentoSecundario hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-transform active:scale-95"
            >
              Verificar
            </button>
          ) : (
            <div className={`p-4 rounded-xl border-2 text-center ${scoreFinal >= 80 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className="font-bold text-lg mb-1">{scoreFinal === 100 ? '¡Excelente!' : 'Resultado'}</p>
              <p className={`text-3xl font-black ${scoreFinal >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{scoreFinal}%</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 text-sm bg-white border shadow-sm rounded-lg hover:bg-slate-50 font-bold text-slate-700 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
}

export default CrosswordActivity;
