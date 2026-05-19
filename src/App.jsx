import { useState } from 'react'
import data from './data.json'

function App() {
  const [activeModuleId, setActiveModuleId] = useState(null)

  const activeModule = data.modulos.find(m => m.id === activeModuleId)

  return (
    <div className="min-h-screen bg-fondo text-textoBase font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-xl text-acento">Geografía 1er Año</h1>
          {activeModuleId && (
            <button 
              onClick={() => setActiveModuleId(null)}
              className="text-sm font-medium hover:underline text-gray-500"
            >
              Volver al inicio
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar / Menu */}
        {!activeModuleId && (
          <div className="w-full flex flex-col gap-4">
            <h2 className="text-2xl font-bold mb-4">Módulos de Aprendizaje</h2>
            {data.modulos.map((modulo) => (
              <div 
                key={modulo.id} 
                onClick={() => setActiveModuleId(modulo.id)}
                className="bg-white p-6 rounded-lg shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{modulo.numero}. {modulo.titulo}</h3>
                <p className="text-gray-600">{modulo.descripcion}</p>
              </div>
            ))}
          </div>
        )}

        {/* Active Module View (Placeholder for now) */}
        {activeModule && (
          <div className="w-full">
            <h2 className="text-3xl font-bold mb-6">{activeModule.titulo}</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 prose max-w-none">
              <p>Contenido del módulo aquí...</p>
              {/* Aquí renderizaremos el contenido del módulo basándonos en activeModule.contenido */}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
