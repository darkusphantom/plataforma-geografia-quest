import { useState, useEffect, useMemo } from "react";
import {
  obtenerTodasLasRespuestas,
  type StudentResult,
  type NotionAnswer,
} from "../../services/notionService";

interface AdminDashboardProps {
  onLogout: () => void;
}

// ── Helpers de exportación ─────────────────────────────────────────────────────

function flattenRows(results: StudentResult[]) {
  const rows: Record<string, string>[] = [];
  for (const student of results) {
    if (student.answers.length === 0) {
      rows.push({
        Cedula: student.cedula,
        Modulo: "",
        PreguntaID: "",
        Respuesta: "",
        Puntaje: "",
        Fecha: "",
      });
    } else {
      for (const ans of student.answers) {
        rows.push({
          Cedula: student.cedula,
          Modulo: ans.modulo,
          PreguntaID: ans.preguntaId,
          Respuesta: ans.respuesta,
          Puntaje: String(ans.puntaje),
          Fecha: ans.fecha ? new Date(ans.fecha).toLocaleString("es-VE") : "",
        });
      }
    }
  }
  return rows;
}

function exportCSV(results: StudentResult[]) {
  const rows = flattenRows(results);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${(r[h] ?? "").replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  downloadFile(
    csvContent,
    "resultados_geografia.csv",
    "text/csv;charset=utf-8;",
  );
}

function exportJSON(results: StudentResult[]) {
  const rows = flattenRows(results);
  downloadFile(
    JSON.stringify(rows, null, 2),
    "resultados_geografia.json",
    "application/json",
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/**
 * Badge de puntaje con color semafórico basado en porcentaje relativo al máximo.
 *
 * @param score - Puntaje obtenido.
 * @param max - Puntaje máximo posible (default 20 para totalScore, o el máx por pregunta).
 */
function ScoreBadge({ score, max = 20 }: { score: number; max?: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  let cls = "bg-red-100 text-red-700";
  if (pct >= 80) cls = "bg-green-100 text-green-700";
  else if (pct >= 50) cls = "bg-yellow-100 text-yellow-700";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}
    >
      {parseFloat(score.toFixed(2))}
    </span>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchCedula, setSearchCedula] = useState("");
  const [filterModulo, setFilterModulo] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Cargar datos al montar
  useEffect(() => {
    setIsLoading(true);
    obtenerTodasLasRespuestas()
      .then(setResults)
      .catch((err) => setError(err.message ?? "Error al cargar datos"))
      .finally(() => setIsLoading(false));
  }, []);

  // Lista única de módulos para el filtro
  const modulos = useMemo(() => {
    const set = new Set<string>();
    for (const r of results)
      for (const a of r.answers) if (a.modulo) set.add(a.modulo);
    return Array.from(set).sort();
  }, [results]);

  // Resultados filtrados
  const filtered = useMemo(() => {
    return results.filter((r) => {
      const cedulaMatch = r.cedula
        .toLowerCase()
        .includes(searchCedula.toLowerCase().trim());
      const moduloMatch =
        !filterModulo || r.answers.some((a) => a.modulo === filterModulo);
      return cedulaMatch && moduloMatch;
    });
  }, [results, searchCedula, filterModulo]);

  // Estadísticas globales
  const stats = useMemo(() => {
    const totalStudents = results.length;
    const studentsWithAnswers = results.filter(
      (r) => r.answers.length > 0,
    ).length;
    // Promedio de nota total (0-20) entre estudiantes que tienen respuestas
    const studentsScores = results
      .filter((r) => r.answers.length > 0)
      .map((r) => r.totalScore);
    const avgScore = studentsScores.length
      ? parseFloat(
          (
            studentsScores.reduce((s, v) => s + v, 0) / studentsScores.length
          ).toFixed(2),
        )
      : 0;
    const moduloCounts: Record<string, number> = {};
    for (const r of results)
      for (const a of r.answers)
        moduloCounts[a.modulo] = (moduloCounts[a.modulo] ?? 0) + 1;
    const topModulo =
      Object.entries(moduloCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { totalStudents, studentsWithAnswers, avgScore, topModulo };
  }, [results]);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    obtenerTodasLasRespuestas()
      .then(setResults)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-violet-900 to-purple-900 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight font-serif">
                Panel de Administrador
              </h1>
              <p className="text-purple-300 text-xs font-medium">
                Geografía 1° · Resultados de Estudiantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Exportar */}
            <button
              id="admin-export-csv"
              onClick={() => exportCSV(filtered)}
              disabled={filtered.length === 0}
              title="Exportar CSV"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow"
            >
              <span>📊</span>
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              id="admin-export-json"
              onClick={() => exportJSON(filtered)}
              disabled={filtered.length === 0}
              title="Exportar JSON"
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow"
            >
              <span>📄</span>
              <span className="hidden sm:inline">JSON</span>
            </button>

            {/* Logout */}
            <button
              id="admin-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-700">Error al cargar datos</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-sm font-bold text-red-600 hover:text-red-800 underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="👥"
              label="Total Estudiantes"
              value={stats.totalStudents}
            />
            <StatCard
              icon="✅"
              label="Con respuestas"
              value={stats.studentsWithAnswers}
            />
            <StatCard
              icon="📈"
              label="Promedio nota total"
              value={`${stats.avgScore}/20`}
              sub="Promedio de notas acumuladas"
            />
            <StatCard
              icon="🏆"
              label="Módulo más activo"
              value={stats.topModulo || "—"}
            />
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            Filtros
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                id="admin-search-cedula"
                type="text"
                placeholder="Buscar por cédula..."
                value={searchCedula}
                onChange={(e) => setSearchCedula(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-sm font-medium text-slate-800 transition-colors"
              />
            </div>
            <div className="sm:w-56">
              <select
                id="admin-filter-modulo"
                value={filterModulo}
                onChange={(e) => setFilterModulo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-sm font-medium text-slate-800 bg-white transition-colors"
              >
                <option value="">Todos los módulos</option>
                {modulos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {(searchCedula || filterModulo) && (
              <button
                onClick={() => {
                  setSearchCedula("");
                  setFilterModulo("");
                }}
                className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors px-3 py-2.5 rounded-xl hover:bg-slate-50"
              >
                ✕ Limpiar
              </button>
            )}
          </div>
          {(searchCedula || filterModulo) && (
            <p className="text-xs text-slate-400 mt-3">
              Mostrando <strong>{filtered.length}</strong> de{" "}
              <strong>{results.length}</strong> estudiantes
            </p>
          )}
        </div>

        {/* Tabla de resultados */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-lg font-serif">
              Resultados por Estudiante
            </h2>
            <button
              id="admin-refresh-btn"
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualizar
            </button>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                  <div className="w-16 h-8 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Vacío */}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-5xl mb-4">🎓</div>
              <p className="text-slate-500 font-semibold">
                {results.length === 0
                  ? "No hay estudiantes registrados aún."
                  : "No hay resultados para los filtros seleccionados."}
              </p>
            </div>
          )}

          {/* Filas por estudiante */}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="divide-y divide-slate-50">
              {filtered.map((student) => {
                const isExpanded = expandedStudent === student.pageId;
                const modulosUnicos = [
                  ...new Set(
                    student.answers.map((a) => a.modulo).filter(Boolean),
                  ),
                ];

                return (
                  <div key={student.pageId}>
                    {/* Fila resumen del estudiante */}
                    <button
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                      onClick={() =>
                        setExpandedStudent(isExpanded ? null : student.pageId)
                      }
                      aria-expanded={isExpanded}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center font-bold text-indigo-600 text-sm flex-shrink-0">
                        {student.cedula.slice(-2)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800">
                          Cédula:{" "}
                          <span className="font-mono">{student.cedula}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {student.answers.length === 0
                            ? "Sin respuestas registradas"
                            : `${student.answers.length} respuesta${student.answers.length > 1 ? "s" : ""} · ${modulosUnicos.length} módulo${modulosUnicos.length > 1 ? "s" : ""}`}
                        </p>
                      </div>

                      {/* Puntaje total */}
                      <div className="text-right flex-shrink-0">
                        {student.answers.length > 0 ? (
                          <>
                            <ScoreBadge score={student.totalScore} max={20} />
                            <p className="text-xs text-slate-400 mt-1">
                              /20 pts
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium">
                            —
                          </span>
                        )}
                      </div>

                      {/* Chevron */}
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Detalle expandido */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 px-6 py-4">
                        {student.answers.length === 0 ? (
                          <p className="text-sm text-slate-400 italic text-center py-4">
                            Este estudiante aún no ha respondido ninguna
                            actividad.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-indigo-50">
                                  <th className="text-left px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                    Módulo
                                  </th>
                                  <th className="text-left px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                    Pregunta
                                  </th>
                                  <th className="text-left px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                    Respuesta
                                  </th>
                                  <th className="text-center px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                    Puntaje
                                  </th>
                                  <th className="text-left px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wider hidden md:table-cell">
                                    Fecha
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {student.answers.map((ans: NotionAnswer) => (
                                  <tr
                                    key={ans.id}
                                    className="hover:bg-slate-50 transition-colors"
                                  >
                                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                                      {ans.modulo || (
                                        <span className="text-slate-300 italic">
                                          —
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                                      {ans.preguntaId || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 max-w-xs">
                                      <span className="line-clamp-2">
                                        {ans.respuesta || (
                                          <span className="text-slate-300 italic">
                                            Sin respuesta
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <ScoreBadge score={ans.puntaje} max={5} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap hidden md:table-cell">
                                      {ans.fecha
                                        ? new Date(ans.fecha).toLocaleString(
                                            "es-VE",
                                            {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            },
                                          )
                                        : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Panel de administración · Plataforma Geografía 1° ·{" "}
          <button
            onClick={onLogout}
            className="text-indigo-400 hover:text-indigo-600 underline font-medium transition-colors"
          >
            Cerrar sesión
          </button>
        </p>
      </main>
    </div>
  );
}
