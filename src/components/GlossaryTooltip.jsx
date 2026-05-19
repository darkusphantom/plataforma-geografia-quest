import { useState } from 'react';

export function GlossaryTooltip({ word, definition }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <span 
      className="glossary-term group"
      onClick={(e) => {
        e.stopPropagation();
        setIsActive(!isActive);
      }}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
    >
      {word}
      {/* Tooltip tipo etiqueta de museo */}
      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 sm:w-80 p-4 bg-[#fdfbf7] border border-amber-900/10 text-textoBase text-sm rounded-xl shadow-2xl z-50 transition-all duration-300 pointer-events-none ${isActive ? 'opacity-100 visible -translate-y-1' : 'opacity-0 invisible'}`}>
        <span className="font-bold block mb-2 text-acentoSecundario capitalize font-serif text-lg border-b border-amber-900/10 pb-1">{word}</span>
        <span className="font-medium leading-relaxed block">{definition}</span>
        {/* Flechita inferior */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-[#fdfbf7] drop-shadow-sm"></span>
      </span>
    </span>
  );
}
