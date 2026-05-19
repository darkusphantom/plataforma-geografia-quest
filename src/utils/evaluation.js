/**
 * Evalúa una respuesta libre de un estudiante contra un conjunto de respuestas esperadas.
 * 
 * @param {string} respuestaUsuario - La respuesta escrita por el estudiante.
 * @param {string[]} respuestasEsperadas - Array de palabras clave o frases esperadas.
 * @returns {{ esCorrecta: boolean, puntuacion: number }}
 */
export function evaluarRespuesta(respuestaUsuario, respuestasEsperadas) {
  if (!respuestaUsuario || !respuestasEsperadas || respuestasEsperadas.length === 0) {
    return { esCorrecta: false, puntuacion: 0 };
  }

  // Función para normalizar texto: minúsculas, sin espacios extra y sin acentos
  const normalize = (str) => {
    return str
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD") // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, ""); // Elimina las marcas de acento
  };

  const cleanUser = normalize(respuestaUsuario);

  // Verificamos si alguna de las respuestas esperadas está incluida en lo que escribió el usuario
  const esCorrecta = respuestasEsperadas.some(esperada => {
    const cleanEsperada = normalize(esperada);
    // Búsqueda por palabra clave (incluida dentro del texto, no requiere coincidencia exacta)
    return cleanUser.includes(cleanEsperada);
  });

  return {
    esCorrecta,
    puntuacion: esCorrecta ? 100 : 0
  };
}
