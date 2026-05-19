export function ModuleCard({ modulo, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:border-acento transition-all duration-300 transform active:scale-95"
    >
      <div className="flex items-center gap-4 mb-3">
        <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-acento font-bold text-xl">
          {modulo.numero}
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-textoBase leading-tight">{modulo.titulo}</h3>
      </div>
      <p className="text-gray-600 sm:ml-16 leading-relaxed">
        {modulo.descripcion}
      </p>
    </div>
  );
}
