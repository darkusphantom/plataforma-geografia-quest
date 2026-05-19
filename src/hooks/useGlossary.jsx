import { useState } from 'react';
import data from '../data/data.json';

export function useGlossary() {
  const [activeTerm, setActiveTerm] = useState(null);
  const glossary = data.glossario;

  const findDefinition = (word) => {
    // Normalizar quitando acentos y pasando a minúsculas
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const normalizedWord = normalize(word);
    const term = glossary.find(item => 
      normalize(item.termino) === normalizedWord || 
      item.id === normalizedWord
    );
    return term ? term.definicion : 'Definición no encontrada.';
  };

  const renderText = (text) => {
    if (!text) return null;
    if (typeof text !== 'string') return text;
    
    const regex = /<glossary>(.*?)<\/glossary>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Agregar texto antes del match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const word = match[1];
      const definition = findDefinition(word);
      const isMobileActive = activeTerm === word;

      // Agregar término interactivo
      parts.push(
        <span 
          key={match.index}
          className="relative inline-block text-acento cursor-help border-b-2 border-dotted border-acento group"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTerm(isMobileActive ? null : word);
          }}
        >
          {word}
          {/* Tooltip */}
          <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 transition-all duration-200 ${isMobileActive ? 'opacity-100 visible -translate-y-1' : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible md:group-hover:-translate-y-1'}`}>
            <span className="font-bold block mb-1 text-blue-200 capitalize">{word}</span>
            {definition}
            {/* Flechita inferior */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
          </span>
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    // Agregar el resto del texto
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return { renderText };
}
