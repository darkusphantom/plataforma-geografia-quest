import { useReducer, useMemo, useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

/** @constant {number} GRID_SIZE - Dimensión de la grilla cuadrada (15×15). */
const GRID_SIZE = 15;

/**
 * @constant {string[]} ALPHABET_ES - Letras del alfabeto español (sin dígrafos)
 * usadas para rellenar celdas vacías.
 */
const ALPHABET_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

/**
 * @constant {string[]} HIGHLIGHT_PALETTE - Paleta de 6 colores de fondo Tailwind
 * para marcar palabras encontradas. El índice corresponde al orden de descubrimiento.
 * @readonly
 */
const HIGHLIGHT_PALETTE = Object.freeze([
  "bg-yellow-300/80 text-yellow-900",
  "bg-emerald-300/80 text-emerald-900",
  "bg-sky-300/80 text-sky-900",
  "bg-rose-300/80 text-rose-900",
  "bg-violet-300/80 text-violet-900",
  "bg-orange-300/80 text-orange-900",
]);

/**
 * @constant {Array<[number,number]>} DIRECTIONS - Vectores de dirección permitidos
 * para la colocación de palabras: [deltaFila, deltaColumna].
 * Sólo izquierda→derecha, arriba→abajo, y diagonal ↘.
 */
const DIRECTIONS = Object.freeze([
  [0, 1],   // horizontal →
  [1, 0],   // vertical ↓
  [1, 1],   // diagonal ↘
]);

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} WordSearchState
 * @property {Array<[number,number]>} celdasSeleccionadas - Celdas actualmente seleccionadas (en curso).
 * @property {string[]} palabrasEncontradas - Palabras ya descubiertas por el estudiante.
 * @property {Object.<string, number>} colorMap - Mapa palabra→índice de color en HIGHLIGHT_PALETTE.
 * @property {boolean} completado - true cuando todas las palabras han sido encontradas.
 * @property {boolean} enviado - true cuando el estudiante presiona "Verificar".
 * @property {number|null} scoreFinal - Score calculado al finalizar (0–100).
 */

/** @type {WordSearchState} */
const initialState = {
  celdasSeleccionadas: [],
  palabrasEncontradas: [],
  /** @type {Object.<string, Array<[number,number]>>} Celdas seleccionadas por el usuario por palabra. */
  celdasPorPalabra: {},
  colorMap: {},
  completado: false,
  enviado: false,
  scoreFinal: null,
};

/**
 * Reducer puro para manejar toda la lógica de estado de la sopa de letras.
 *
 * @param {WordSearchState} state - Estado actual.
 * @param {{ type: string, payload?: any }} action - Acción despachada.
 * @returns {WordSearchState} Nuevo estado.
 */
function wordSearchReducer(state, action) {
  switch (action.type) {
    case "SET_SELECCION":
      return { ...state, celdasSeleccionadas: action.payload };

    case "PALABRA_ENCONTRADA": {
      const { palabra, colorIndex, celdasSeleccionadas } = action.payload;
      const yaEncontrada = state.palabrasEncontradas.includes(palabra);
      if (yaEncontrada) return { ...state, celdasSeleccionadas: [] };

      const nuevasEncontradas = [...state.palabrasEncontradas, palabra];
      const nuevoColorMap = { ...state.colorMap, [palabra]: colorIndex };
      // Guardamos las celdas que el USUARIO seleccionó, no las del generador.
      const nuevasCeldasPorPalabra = { ...state.celdasPorPalabra, [palabra]: celdasSeleccionadas };
      const completado = action.payload.totalPalabras === nuevasEncontradas.length;

      return {
        ...state,
        celdasSeleccionadas: [],
        palabrasEncontradas: nuevasEncontradas,
        celdasPorPalabra: nuevasCeldasPorPalabra,
        colorMap: nuevoColorMap,
        completado,
        scoreFinal: completado
          ? Math.round((nuevasEncontradas.length / action.payload.totalPalabras) * 100)
          : state.scoreFinal,
      };
    }

    case "SELECCION_INVALIDA":
      return { ...state, celdasSeleccionadas: [] };

    case "VERIFICAR": {
      const score = Math.round(
        (state.palabrasEncontradas.length / action.payload.totalPalabras) * 100
      );
      return { ...state, enviado: true, scoreFinal: score };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// GRID GENERATION (algoritmo de placement)
// ---------------------------------------------------------------------------

/**
 * Intenta colocar una palabra en la grilla dado un punto de inicio y una dirección.
 *
 * @param {string[][]} grid - Grilla mutable (15×15) con letras o null.
 * @param {string} word - Palabra en MAYÚSCULAS a colocar.
 * @param {number} row - Fila de inicio.
 * @param {number} col - Columna de inicio.
 * @param {number} dr - Delta fila (dirección).
 * @param {number} dc - Delta columna (dirección).
 * @returns {boolean} true si se pudo colocar, false si hay conflicto de espacio o letras.
 */
function canPlace(grid, word, row, col, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r][c] !== null && grid[r][c] !== word[i]) return false;
  }
  return true;
}

/**
 * Coloca una palabra en la grilla (mutación directa sobre el array).
 * Debe llamarse solo tras validar con `canPlace`.
 *
 * @param {string[][]} grid - Grilla mutable.
 * @param {string} word - Palabra a colocar.
 * @param {number} row - Fila de inicio.
 * @param {number} col - Columna de inicio.
 * @param {number} dr - Delta fila.
 * @param {number} dc - Delta columna.
 * @returns {Array<[number,number]>} Lista de posiciones [fila, col] ocupadas por la palabra.
 */
function placeWord(grid, word, row, col, dr, dc) {
  const positions = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = word[i];
    positions.push([r, c]);
  }
  return positions;
}

/**
 * Genera la grilla 15×15 con todas las palabras colocadas algorítmicamente.
 * Las celdas vacías se rellenan con letras aleatorias del alfabeto español.
 *
 * Estrategia de placement:
 * 1. Baraja las palabras de mayor a menor (las más largas primero).
 * 2. Para cada palabra, intenta hasta MAX_ATTEMPTS combinaciones aleatorias
 *    de (fila, columna, dirección).
 * 3. Si no encuentra posición válida, la palabra se omite silenciosamente
 *    (situación extrema en grillas pequeñas con palabras muy largas).
 *
 * @param {string[]} palabras - Array de palabras en MAYÚSCULAS.
 * @returns {{ grid: string[][], wordPositions: Object.<string, Array<[number,number]>> }}
 *   - grid: La grilla final con letras.
 *   - wordPositions: Mapa palabra → array de posiciones [fila, col].
 */
function generateGrid(palabras) {
  const MAX_ATTEMPTS = 200;

  // Inicializar grilla con nulls
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  /** @type {Object.<string, Array<[number,number]>>} */
  const wordPositions = {};

  // Ordenar: palabras largas primero para maximizar colocaciones exitosas
  const sorted = [...palabras].sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    let placed = false;

    for (let attempt = 0; attempt < MAX_ATTEMPTS && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);

      if (canPlace(grid, word, row, col, dr, dc)) {
        const positions = placeWord(grid, word, row, col, dr, dc);
        wordPositions[word] = positions;
        placed = true;
      }
    }
  }

  // Rellenar celdas vacías con letras aleatorias del español
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = ALPHABET_ES[Math.floor(Math.random() * ALPHABET_ES.length)];
      }
    }
  }

  return { grid, wordPositions };
}

// ---------------------------------------------------------------------------
// SELECTION HELPERS
// ---------------------------------------------------------------------------

/**
 * Calcula todas las celdas en línea recta entre dos puntos de la grilla.
 * Retorna array vacío si la selección no es estrictamente horizontal,
 * vertical o diagonal.
 *
 * @param {[number,number]} start - Celda de inicio [fila, col].
 * @param {[number,number]} end - Celda de fin [fila, col].
 * @returns {Array<[number,number]>} Celdas en la línea (inclusive ambos extremos).
 */
function getCellsInLine(start, end) {
  const [r1, c1] = start;
  const [r2, c2] = end;
  const dr = r2 - r1;
  const dc = c2 - c1;

  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  // Validar que sea línea recta o diagonal perfecta
  if (dr !== 0 && dc !== 0 && absDr !== absDc) return [];

  const steps = Math.max(absDr, absDc);
  if (steps === 0) return [start];

  const stepR = dr === 0 ? 0 : dr / absDr;
  const stepC = dc === 0 ? 0 : dc / absDc;

  const cells = [];
  for (let i = 0; i <= steps; i++) {
    cells.push([r1 + stepR * i, c1 + stepC * i]);
  }
  return cells;
}

/**
 * Extrae el texto de un array de celdas consultando la grilla.
 *
 * @param {Array<[number,number]>} cells - Celdas seleccionadas.
 * @param {string[][]} grid - Grilla de letras.
 * @returns {string} Texto formado por la selección.
 */
function getCellsText(cells, grid) {
  return cells.map(([r, c]) => grid[r][c]).join("");
}

/**
 * Comprueba si el texto seleccionado (o su reversa) coincide con alguna
 * de las palabras objetivo.
 *
 * @param {string} text - Texto extraído de las celdas.
 * @param {readonly string[]} palabras - Palabras objetivo (Object.freeze'd).
 * @returns {string|null} La palabra encontrada o null.
 */
function matchWord(text, palabras) {
  const reversed = text.split("").reverse().join("");
  for (const word of palabras) {
    if (text === word || reversed === word) return word;
  }
  return null;
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

/**
 * Celda individual de la grilla.
 *
 * @param {Object} props
 * @param {string} props.letter - Letra a mostrar.
 * @param {boolean} props.isSelected - Si está en la selección activa.
 * @param {string|null} props.highlightClass - Clases Tailwind de highlight persistente, o null.
 * @param {function} props.onPointerDown - Handler de inicio de selección.
 * @param {function} props.onPointerEnter - Handler de arrastre sobre la celda.
 * @param {[number,number]} props.coords - [fila, col] de la celda.
 */
/**
 * Celda individual de la grilla.
 *
 * @param {Object} props
 * @param {string} props.letter - Letra a mostrar.
 * @param {boolean} props.isSelected - Si está en la selección activa.
 * @param {string|null} props.highlightClass - Clases Tailwind de highlight persistente, o null.
 * @param {function} props.onPointerDown - Handler de inicio de selección.
 * @param {[number,number]} props.coords - [fila, col] de la celda.
 */
function GridCell({ letter, isSelected, highlightClass, onPointerDown, coords }) {
  const baseClasses =
    "flex items-center justify-center font-bold select-none cursor-pointer rounded transition-all duration-150 border border-slate-200/60 touch-none";

  const stateClasses = highlightClass
    ? `${highlightClass} scale-105 shadow-sm border-transparent`
    : isSelected
    ? "bg-acento text-white scale-105 shadow-md border-transparent z-10"
    : "bg-white/70 text-textoBase hover:bg-sky-50 hover:border-sky-300 active:scale-95";

  return (
    <div
      role="gridcell"
      aria-label={`Letra ${letter}, fila ${coords[0] + 1}, columna ${coords[1] + 1}`}
      data-row={coords[0]}
      data-col={coords[1]}
      className={`${baseClasses} ${stateClasses} w-[22px] h-[22px] text-[10px] md:w-8 md:h-8 md:text-sm`}
      onPointerDown={() => onPointerDown(coords)}
    >
      {letter}
    </div>
  );
}

/**
 * Panel lateral con la lista de palabras a encontrar.
 *
 * @param {Object} props
 * @param {string[]} props.palabras - Lista completa de palabras.
 * @param {string[]} props.palabrasEncontradas - Palabras ya descubiertas.
 * @param {Object.<string,number>} props.colorMap - Mapa palabra→índice de color.
 */
function WordList({ palabras, palabrasEncontradas, colorMap }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-serif font-bold text-base text-textoBase mb-1">
        Palabras a encontrar
      </h3>
      <ul className="flex flex-col gap-1.5" role="list">
        {palabras.map((word) => {
          const found = palabrasEncontradas.includes(word);
          const colorClass = found ? HIGHLIGHT_PALETTE[colorMap[word]] : "";
          return (
            <li
              key={word}
              aria-label={found ? `${word}, encontrada` : word}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${
                found
                  ? `${colorClass} line-through opacity-70 shadow-sm`
                  : "bg-white/60 text-textoBase border border-slate-200"
              }`}
            >
              {word}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Banner de resultado final mostrado al completar o verificar.
 *
 * @param {Object} props
 * @param {number} props.score - Score final (0–100).
 * @param {boolean} props.completado - Si se completó al 100%.
 * @param {number} props.encontradas - Cantidad de palabras encontradas.
 * @param {number} props.total - Total de palabras.
 * @param {function} props.onReset - Callback para reiniciar.
 */
function ResultBanner({ score, completado, encontradas, total, onReset }) {
  const isGreat = score >= 80;
  const emoji = score === 100 ? "🏆" : score >= 80 ? "🌟" : score >= 50 ? "😊" : "💪";
  const colorClasses = isGreat
    ? "from-emerald-50 to-green-100 border-emerald-300"
    : "from-amber-50 to-orange-100 border-amber-300";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl border-2 bg-gradient-to-br ${colorClasses} p-5 text-center shadow-md mt-4`}
    >
      <div className="text-4xl mb-2" aria-hidden="true">{emoji}</div>
      <p className="font-serif font-bold text-xl text-textoBase">
        {completado ? "¡Completaste la sopa de letras!" : "Resultado parcial"}
      </p>
      <p className="text-3xl font-black mt-2 text-acento">{score}%</p>
      <p className="text-sm text-slate-600 mt-1">
        {encontradas} de {total} palabras encontradas
      </p>
      <button
        id="word-search-reset-btn"
        onClick={onReset}
        className="mt-4 px-6 py-2 bg-acento text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition-colors active:scale-95"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

/**
 * @component WordSearchActivity
 * @description Actividad interactiva de sopa de letras (15×15) con soporte
 * completo para escritorio (mouse) y móvil (touch). Implementa el patrón
 * Compound Component con `useReducer` para el estado interno.
 *
 * La grilla se genera algorítmicamente en un `useMemo` y las posiciones de
 * las palabras se almacenan en un `useRef` (nunca en el DOM).
 * La validación usa `Object.freeze()` sobre el array de palabras para evitar
 * mutaciones accidentales.
 *
 * @param {Object}   props
 * @param {string[]} props.palabras    - Array de palabras en MAYÚSCULAS a encontrar.
 * @param {string}   props.titulo      - Título de la actividad.
 * @param {string}   props.instruccion - Instrucción mostrada al estudiante.
 * @param {function(number): void} props.onComplete - Callback llamado con el score (0-100)
 *   al completar o verificar la actividad.
 *
 * @example
 * <WordSearchActivity
 *   palabras={["CONTINENTE", "OCEANO", "RELIEVE"]}
 *   titulo="Geografía Física"
 *   instruccion="Encuentra todas las palabras del tema."
 *   onComplete={(score) => console.log(score)}
 * />
 */
/**
 * Construye el estado inicial del reducer a partir del progreso guardado.
 * Si `savedProgress` existe, el componente arranca en estado "enviado"
 * mostrando el resultado previo. El estudiante puede reintentar sin que
 * el padre necesite intervenir.
 *
 * @param {Object|null} savedProgress - Progreso almacenado en useNotionProgress, o null.
 * @returns {WordSearchState}
 */
function getInitialState(savedProgress) {
  if (!savedProgress) return initialState;
  return {
    ...initialState,
    enviado: true,
    scoreFinal: savedProgress.calificacion,
  };
}

export function WordSearchActivity({ palabras, titulo, instruccion, onComplete, savedProgress }) {
  // Freeze del array original para evitar mutaciones en la capa de validación.
  // Memoizado basado en el contenido del array (palabras.join) para tolerar referencias inestables del componente padre.
  const frozenPalabras = useMemo(() => Object.freeze([...palabras]), [palabras.join(",")]);

  // Inicializa desde savedProgress si existe (lazy initializer de useReducer).
  // Así el estado interno es la única fuente de verdad; el reset funciona
  // sin necesidad de que el padre borre el progreso guardado.
  const [state, dispatch] = useReducer(wordSearchReducer, savedProgress, getInitialState);

  // Ref para el punto de inicio del gesto de selección
  const selectionStartRef = useRef(null);
  // Ref para saber si el puntero está presionado
  const isPointerDownRef = useRef(false);
  /** @type {React.MutableRefObject<number|null>} Ref que registra el último score guardado en el backend para evitar bucles infinitos de renderizado */
  const lastReportedScoreRef = useRef(savedProgress ? savedProgress.calificacion : null);
  /** @type {React.MutableRefObject<{row: number, col: number}|null>} Ref que registra la última celda sobre la que pasó el puntero para filtrar eventos de movimiento duplicados */
  const lastHoveredCellRef = useRef(null);

  // ─── Generación de la grilla (una sola vez por prop de palabras) ───────────
  const { grid } = useMemo(() => generateGrid(frozenPalabras), [frozenPalabras]);

  // ─── Mapa de celdas con highlight persistente ─────────────────────────────
  /**
   * Construye un mapa "r,c" → colorClass para las celdas de palabras encontradas.
   * Usa las celdas que el USUARIO seleccionó (state.celdasPorPalabra), no las
   * posiciones del generador, garantizando que el highlight aparezca exactamente
   * donde el estudiante marcó.
   *
   * @type {Object.<string, string>}
   */
  const highlightMap = useMemo(() => {
    const map = {};
    for (const word of state.palabrasEncontradas) {
      const positions = state.celdasPorPalabra[word];
      if (!positions) continue;
      const colorClass = HIGHLIGHT_PALETTE[state.colorMap[word]];
      for (const [r, c] of positions) {
        map[`${r},${c}`] = colorClass;
      }
    }
    return map;
  }, [state.palabrasEncontradas, state.colorMap, state.celdasPorPalabra]);

  // ─── Efecto: llamar onComplete automáticamente al completar ───────────────
  useEffect(() => {
    if (
      state.completado &&
      state.scoreFinal !== null &&
      lastReportedScoreRef.current !== state.scoreFinal
    ) {
      lastReportedScoreRef.current = state.scoreFinal;
      onComplete(state.scoreFinal);
    }
  }, [state.completado, state.scoreFinal, onComplete]);

  // ─── Efecto: llamar onComplete al verificar ──────────────────────────────
  useEffect(() => {
    if (
      state.enviado &&
      state.scoreFinal !== null &&
      !state.completado &&
      lastReportedScoreRef.current !== state.scoreFinal
    ) {
      lastReportedScoreRef.current = state.scoreFinal;
      onComplete(state.scoreFinal);
    }
  }, [state.enviado, state.scoreFinal, state.completado, onComplete]);

  // ─── Handlers de selección ───────────────────────────────────────────────

  /**
   * Inicia una nueva selección al presionar sobre una celda.
   *
   * @param {[number,number]} coords - [fila, col] de la celda presionada.
   */
  /**
   * Inicia una nueva selección al presionar sobre una celda.
   *
   * @param {[number,number]} coords - [fila, col] de la celda presionada.
   */
  const handlePointerDown = useCallback((coords) => {
    if (state.enviado || state.completado) return;
    isPointerDownRef.current = true;
    selectionStartRef.current = coords;
    lastHoveredCellRef.current = { row: coords[0], col: coords[1] };
    dispatch({ type: "SET_SELECCION", payload: [coords] });
  }, [state.enviado, state.completado]);

  /**
   * Handler de `onPointerMove` sobre el contenedor de la grilla.
   * Usa `document.elementFromPoint` para determinar qué celda está bajo el puntero,
   * leyendo los atributos `data-row` / `data-col` para obtener las coordenadas.
   * Este enfoque evita el problema de `setPointerCapture` en desktop, donde
   * `onPointerEnter` en celdas hijas deja de dispararse tras capturar el pointer.
   *
   * @param {React.PointerEvent} e - Evento de puntero del contenedor.
   */
  const handleGridPointerMove = useCallback((e) => {
    if (!isPointerDownRef.current || !selectionStartRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    // Buscar el elemento con data-row/data-col (puede ser un hijo de GridCell)
    const cell = el.closest('[data-row]');
    if (!cell) return;
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);
    if (isNaN(row) || isNaN(col)) return;

    // Evitar procesar y re-renderizar si el puntero sigue sobre la misma celda
    if (
      lastHoveredCellRef.current &&
      lastHoveredCellRef.current.row === row &&
      lastHoveredCellRef.current.col === col
    ) {
      return;
    }
    lastHoveredCellRef.current = { row, col };

    const cells = getCellsInLine(selectionStartRef.current, [row, col]);
    if (cells.length > 0) {
      dispatch({ type: "SET_SELECCION", payload: cells });
    }
  }, []);



  /**
   * Finaliza la selección al soltar el puntero y valida si las celdas
   * forman una palabra de la lista. La validación se realiza contra
   * `frozenPalabras` (Object.freeze'd), nunca contra el DOM.
   */
  const handlePointerUp = useCallback(() => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    lastHoveredCellRef.current = null;

    const cells = state.celdasSeleccionadas;
    if (cells.length < 2) {
      dispatch({ type: "SELECCION_INVALIDA" });
      return;
    }

    const text = getCellsText(cells, grid);
    const foundWord = matchWord(text, frozenPalabras);

    if (foundWord && !state.palabrasEncontradas.includes(foundWord)) {
      const colorIndex = state.palabrasEncontradas.length % HIGHLIGHT_PALETTE.length;
      dispatch({
        type: "PALABRA_ENCONTRADA",
        payload: {
          palabra: foundWord,
          colorIndex,
          totalPalabras: frozenPalabras.length,
          // Las celdas exactas que el usuario seleccionó → usadas para el highlight.
          celdasSeleccionadas: cells,
        },
      });
    } else {
      dispatch({ type: "SELECCION_INVALIDA" });
    }
  }, [state.celdasSeleccionadas, state.palabrasEncontradas, grid, frozenPalabras]);

  /**
   * Construye el Set de celdas actualmente seleccionadas para lookup O(1).
   * @type {Set<string>}
   */
  const selectedSet = useMemo(
    () => new Set(state.celdasSeleccionadas.map(([r, c]) => `${r},${c}`)),
    [state.celdasSeleccionadas]
  );

  /**
   * Maneja la acción del botón "Verificar": calcula score parcial
   * y dispara `onComplete`.
   */
  const handleVerificar = useCallback(() => {
    dispatch({
      type: "VERIFICAR",
      payload: { totalPalabras: frozenPalabras.length },
    });
  }, [frozenPalabras.length]);

  /**
   * Reinicia toda la actividad a su estado inicial.
   */
  const handleReset = useCallback(() => {
    lastReportedScoreRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  const showResult = state.completado || state.enviado;
  const progress = Math.round((state.palabrasEncontradas.length / frozenPalabras.length) * 100);

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-blue-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/40 p-4 sm:p-6 border-b border-blue-100">
        <h3 className="text-xl sm:text-2xl font-bold text-textoBase mb-1 font-serif">
          {titulo}
        </h3>
        <p className="text-gray-600 font-medium text-sm">{instruccion}</p>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-6">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-500">Progreso</span>
            <span className="text-xs font-bold text-acento">{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 rounded-full bg-slate-200 overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-acento transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Layout: grilla + panel */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Grilla: onPointerMove en el contenedor para detectar arrastre
              en desktop (evita el problema de setPointerCapture). */}
          <div
            role="grid"
            aria-label="Sopa de letras"
            aria-readonly={showResult}
            className="overflow-x-auto touch-none"
            onPointerMove={handleGridPointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              className="inline-grid gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, auto)` }}
            >
              {grid.map((row, rIdx) =>
                row.map((letter, cIdx) => {
                  const key = `${rIdx},${cIdx}`;
                  return (
                    <GridCell
                      key={key}
                      letter={letter}
                      coords={[rIdx, cIdx]}
                      isSelected={selectedSet.has(key)}
                      highlightClass={highlightMap[key] ?? null}
                      onPointerDown={handlePointerDown}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Panel lateral de palabras */}
          <div className="md:min-w-[160px] md:max-w-[200px]">
            <WordList
              palabras={frozenPalabras}
              palabrasEncontradas={state.palabrasEncontradas}
              colorMap={state.colorMap}
            />

            {/* Botón verificar */}
            {!showResult && (
              <button
                id="word-search-verify-btn"
                onClick={handleVerificar}
                className="mt-4 w-full py-2.5 px-4 bg-acentoSecundario hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all duration-200 active:scale-95 shadow-sm"
              >
                Verificar
              </button>
            )}
          </div>
        </div>

        {/* Banner de resultado */}
        {showResult && (
          <ResultBanner
            score={state.scoreFinal ?? 0}
            completado={state.completado}
            encontradas={state.palabrasEncontradas.length}
            total={frozenPalabras.length}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default WordSearchActivity;
