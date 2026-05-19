import { useGlossary } from '../hooks/useGlossary';

export function ContentRenderer({ bloques }) {
  const { renderText } = useGlossary();

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
          default:
            return null;
        }
      })}
    </div>
  );
}
