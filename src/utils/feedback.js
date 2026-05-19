export const getFeedback = (puntaje) => {
  if (puntaje >= 80) return { emoji: "✅", mensaje: "¡Excelente! Lo lograste", color: "text-exito bg-green-50 border-exito" };
  if (puntaje >= 50) return { emoji: "😊", mensaje: "Sigue adelante, lo puedes hacer mejor", color: "text-advertencia bg-yellow-50 border-advertencia" };
  return { emoji: "❌", mensaje: "Intenta de nuevo", color: "text-error bg-red-50 border-error" };
};
