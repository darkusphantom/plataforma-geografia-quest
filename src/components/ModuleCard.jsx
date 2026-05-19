export function ModuleCard({ modulo, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-2xl shadow-md border border-blue-50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-acento/50 group relative overflow-hidden"
    >
      {/* Elemento decorativo topográfico sutil */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-green-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110 opacity-70 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-acento to-acentoSecundario text-white flex items-center justify-center font-bold text-xl shadow-md">
          {modulo.numero}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-acento transition-colors font-serif leading-tight">
          {modulo.titulo}
        </h3>
      </div>
      
      <p className="text-gray-600 line-clamp-3 text-base relative z-10 font-medium leading-relaxed">
        {modulo.descripcion}
      </p>
      
      <div className="mt-5 flex items-center text-acentoSecundario font-bold text-sm relative z-10 group-hover:translate-x-2 transition-transform duration-300">
        Explorar módulo <span className="ml-2">→</span>
      </div>
    </div>
  );
}
