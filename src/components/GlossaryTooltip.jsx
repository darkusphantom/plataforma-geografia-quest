import { useState } from 'react';

export function GlossaryTooltip({ word, definition }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <span 
      className="relative inline-block text-acento cursor-help border-b-2 border-dotted border-acento group"
      onClick={(e) => {
        e.stopPropagation();
        setIsActive(!isActive);
      }}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
    >
      {word}
      {/* Tooltip */}
      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 transition-all duration-200 pointer-events-none ${isActive ? 'opacity-100 visible -translate-y-1' : 'opacity-0 invisible'}`}>
        <span className="font-bold block mb-1 text-blue-200 capitalize">{word}</span>
        {definition}
        {/* Flechita inferior */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
      </span>
    </span>
  );
}
