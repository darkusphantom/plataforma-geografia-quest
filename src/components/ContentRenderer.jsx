import { GlossaryTooltip } from './GlossaryTooltip';
import data from '../data/data.json';

export function ContentRenderer({ bloques }) {
  const glossary = data.glossario;

  // Busca la definición en el JSON
  const findDefinition = (word) => {
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedWord = normalize(word);
    const term = glossary.find(item => 
      normalize(item.termino) === normalizedWord || 
      item.id === normalizedWord
    );
    return term ? term.definicion : 'Definición no encontrada.';
  };

  // Parsea el texto y reemplaza <glossary> con el componente GlossaryTooltip
  const renderText = (text) => {
    if (!text) return null;
    if (typeof text !== 'string') return text;
    
    const regex = /<glossary>(.*?)<\/glossary>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const word = match[1];
      const definition = findDefinition(word);

      parts.push(
        <GlossaryTooltip key={match.index} word={word} definition={definition} />
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {bloques.map((bloque, index) => {
        switch (bloque.tipo) {
          case 'titulo-seccion':
            return (
              <h2 key={index} className="text-2xl sm:text-3xl font-bold text-textoBase border-b-2 pb-3 border-gray-100 mt-8 first:mt-0">
                {renderText(bloque.texto)}
              </h2>
            );
          case 'titulo-subseccion':
            return (
              <h3 key={index} className="text-xl sm:text-2xl font-semibold text-textoBase mt-8">
                {renderText(bloque.texto)}
              </h3>
            );
          case 'parrafo':
            return (
              <p key={index} className="text-gray-700 leading-relaxed text-lg sm:text-xl">
                {renderText(bloque.texto)}
              </p>
            );
          case 'lista':
            return (
              <ul key={index} className="list-disc pl-6 space-y-3 text-gray-700 text-lg sm:text-xl marker:text-acento">
                {bloque.items.map((item, i) => (
                  <li key={i}>{renderText(item)}</li>
                ))}
              </ul>
            );
          case 'callout':
            return (
              <div
                key={index}
                className="flex gap-3 items-start bg-blue-50 border-l-4 border-acento rounded-r-xl px-4 py-3 my-2 shadow-sm"
                role="note"
                aria-label="Dato curioso"
              >
                {bloque.icono && (
                  <span className="text-2xl leading-snug flex-shrink-0" aria-hidden="true">
                    {bloque.icono}
                  </span>
                )}
                <p className="text-blue-900 leading-relaxed text-base sm:text-lg font-medium">
                  {renderText(bloque.texto)}
                </p>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
