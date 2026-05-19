import { useState } from 'react'
import data from './data.json'
import { ModuleCard } from './components/ModuleCard'
import { ContentRenderer } from './components/ContentRenderer'
import { TrueFalseActivity } from './components/TrueFalseActivity'
import { useProgress } from './hooks/useProgress'

function App() {
  const [activeModuleId, setActiveModuleId] = useState(null)
  const { saveActivityProgress, getActivityProgress } = useProgress()

  const activeModule = data.modulos.find(m => m.id === activeModuleId)

  return (
    <div className="min-h-screen bg-fondo text-textoBase font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-xl sm:text-2xl text-acento truncate pr-4">
            {activeModule ? activeModule.titulo : "Geografía 1er Año"}
          </h1>
          {activeModuleId && (
            <button 
              onClick={() => setActiveModuleId(null)}
              className="text-sm sm:text-base font-medium hover:text-acento transition-colors text-gray-500 whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-md hover:bg-blue-50"
            >
              ← Volver
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6" onClick={() => {
        // En un caso real, aquí podríamos limpiar el activeTerm del glosario si quisiéramos, 
        // pero lo manejamos directamente dentro del hook con clics en los elementos.
      }}>
        
        {/* Sidebar / Menu List */}
        {!activeModuleId && (
          <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="mb-4">
              <h2 className="text-3xl font-bold mb-2 text-gray-800">Módulos de Aprendizaje</h2>
              <p className="text-gray-600 text-lg">Selecciona un módulo para comenzar tu aprendizaje.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.modulos.map((modulo) => (
                <ModuleCard 
                  key={modulo.id} 
                  modulo={modulo} 
                  onClick={() => setActiveModuleId(modulo.id)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Module View */}
        {activeModule && (
          <div className="w-full">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
              <ContentRenderer bloques={activeModule.contenido.bloques} />
              
              {/* Espacio para la actividad evaluativa */}
              <div className="mt-12 pt-8 border-t-2 border-gray-100">
                {activeModule.actividad && activeModule.actividad.tipo === 'verdadero-falso' ? (
                  <TrueFalseActivity 
                    questions={activeModule.actividad.preguntas} 
                    savedProgress={getActivityProgress(activeModule.id, activeModule.actividad.id)}
                    onSubmit={({ respuestas, calificacion }) => {
                      saveActivityProgress(activeModule.id, activeModule.actividad.id, respuestas, calificacion);
                    }}
                  />
                ) : activeModule.actividad ? (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                    <h3 className="text-2xl font-bold text-acento mb-2">Actividad: {activeModule.actividad.titulo}</h3>
                    <p className="text-gray-600 mb-4">Esta actividad tipo "{activeModule.actividad.tipo}" estará disponible próximamente.</p>
                    <button disabled className="bg-acento text-white px-6 py-3 rounded-lg font-bold opacity-50 cursor-not-allowed">
                      Iniciar Actividad
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
