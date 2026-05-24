/**
 * Genera feedback visual basado en el puntaje obtenido relativo al máximo posible.
 *
 * @param {number} puntaje - Puntos obtenidos por el estudiante.
 * @param {number} [puntajeMaximo=5] - Puntuación máxima posible del módulo (escala base 20: 5 pts c/u).
 * @returns {{ emoji: string, mensaje: string, color: string }}
 */
export const getFeedback = (puntaje, puntajeMaximo = 5) => {
  const porcentaje = puntajeMaximo > 0 ? (puntaje / puntajeMaximo) * 100 : 0;
  if (porcentaje >= 80) return { emoji: "✅", mensaje: "¡Excelente! Lo lograste", color: "text-exito bg-green-50 border-exito" };
  if (porcentaje >= 50) return { emoji: "😊", mensaje: "Sigue adelante, lo puedes hacer mejor", color: "text-advertencia bg-yellow-50 border-advertencia" };
  return { emoji: "❌", mensaje: "Intenta de nuevo", color: "text-error bg-red-50 border-error" };
};
