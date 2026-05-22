import { useState } from 'react';
import data from './data/data.json';
import { ModuleList } from './components/ModuleList';
import { ModuleCard } from './components/ModuleCard';
import { ContentRenderer } from './components/ContentRenderer';
import { TrueFalseActivity } from './components/TrueFalseActivity';
import { FreeTextActivity } from './components/FreeTextActivity';
import { MatchingActivity } from './components/MatchingActivity';
import { ProgressBar } from './components/ProgressBar';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useNotionProgress } from './hooks/useNotionProgress';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';

// ── Guard de autenticación + contenido de la app ──────────────────────────────

/**
 * Componente interno que requiere autenticación.
 * Muestra Login/Register si no hay sesión, y la plataforma si la hay.
 */
function AppContent() {
  const { user, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Admin state ────────────────────────────────────────────────────────────
  const [adminView, setAdminView] = useState('off'); // 'off' | 'login' | 'dashboard'

  // useNotionProgress recibe el pageId del estudiante autenticado (null si no hay sesión)
  // IMPORTANTE: los hooks deben llamarse siempre, antes de cualquier return condicional
  const { progress, saveActivityProgress, getActivityProgress, clearProgress } = useNotionProgress(
    user?.pageId ?? null
  );

  // ── Admin routing (después de todos los hooks) ───────────────────────────────────
  if (adminView === 'login') {
    return (
      <AdminLoginPage
        onSuccess={() => setAdminView('dashboard')}
        onBack={() => setAdminView('off')}
      />
    );
  }
  if (adminView === 'dashboard') {
    return <AdminDashboard onLogout={() => setAdminView('off')} />;
  }

  // ── Guard ────────────────────────────────────────────────────────────────────
  if (!user) {
    return authMode === 'login'
      ? (
        <div className="relative">
          <LoginPage onToggle={() => setAuthMode('register')} />
          {/* Enlace discreto de acceso admin */}
          <button
            id="go-to-admin"
            onClick={() => setAdminView('login')}
            className="fixed bottom-4 right-4 text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:border-gray-300"
          >
            🔒 Acceso Admin
          </button>
        </div>
      )
      : (
        <div className="relative">
          <RegisterPage onToggle={() => setAuthMode('login')} />
          <button
            id="go-to-admin-register"
            onClick={() => setAdminView('login')}
            className="fixed bottom-4 right-4 text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:border-gray-300"
          >
            🔒 Acceso Admin
          </button>
        </div>
      );
  }

  // ── App principal ─────────────────────────────────────────────────────────────
  const activeModule = data.modulos.find(m => m.id === activeModuleId);

  const handleNextModule = () => {
    const currentIndex = data.modulos.findIndex(m => m.id === activeModuleId);
    if (currentIndex < data.modulos.length - 1) {
      setActiveModuleId(data.modulos[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasNextModule = activeModuleId ? data.modulos.findIndex(m => m.id === activeModuleId) < data.modulos.length - 1 : false;

  return (
    <div className="min-h-screen bg-fondo text-textoBase font-sans flex flex-col md:flex-row bg-topografico">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white/90 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-30 flex items-center justify-between border-b border-blue-100">
        <h1 className="font-bold text-xl text-acento truncate font-serif">Geografía 1er Año</h1>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-500 hover:text-acento p-2 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-64 bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0 mt-[68px] md:mt-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="hidden md:block mb-8 pb-4 border-b border-blue-50">
            <h1 className="font-bold text-3xl text-acento font-serif">Atlas</h1>
            <p className="text-sm font-bold text-acentoSecundario uppercase tracking-widest mt-1">Geografía 1°</p>
          </div>

          {/* Info del estudiante autenticado */}
          <div className="mb-4 px-3 py-2.5 bg-blue-50 rounded-xl flex items-center gap-2">
            <span className="text-blue-500">👤</span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Estudiante</p>
              <p className="text-sm font-bold text-gray-800 truncate">{user.cedula}</p>
            </div>
          </div>
          
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navegación</h2>
          
          <nav className="space-y-2">
            <button 
              onClick={() => { setActiveModuleId(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-colors ${!activeModuleId ? 'bg-blue-50 text-acento font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}
            >
              <span>🏠</span> Inicio
            </button>
            
            <div className="pt-4 pb-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Módulos</h2>
            </div>
            
            {data.modulos.map((modulo) => {
              const moduloCompletado = !!progress[modulo.id];
              return (
                <button 
                  key={modulo.id}
                  onClick={() => { setActiveModuleId(modulo.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeModuleId === modulo.id ? 'bg-blue-50 text-acento font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {modulo.numero}
                    </span>
                    <span className="truncate">{modulo.titulo}</span>
                  </div>
                  {moduloCompletado && (
                    <span className="text-green-500 text-sm ml-2">✅</span>
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
            <ProgressBar progress={progress} totalModules={data.modulos.length} />
            
            <button 
              onClick={() => {
                if (window.confirm("¿Estás seguro de que quieres borrar todo tu progreso? Esta acción no se puede deshacer.")) {
                  clearProgress();
                }
              }}
              className="mt-6 w-full text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2.5 rounded-lg transition-colors font-semibold border border-transparent hover:border-red-100"
            >
              Borrar mis datos
            </button>

            {/* Cerrar sesión */}
            <button
              id="logout-btn"
              onClick={() => {
                if (window.confirm("¿Cerrar sesión?")) logout();
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg transition-colors font-semibold border border-transparent hover:border-gray-100 flex items-center justify-center gap-2"
            >
              <span>🚪</span> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full relative z-0">
        <div className="max-w-4xl mx-auto">
          {!activeModuleId ? (
            <div className="animate-fade-in mt-4 md:mt-0">
              <h2 className="text-3xl font-bold mb-2 text-gray-800">Bienvenido al curso</h2>
              <p className="text-gray-600 text-lg mb-8">Selecciona un módulo en el menú lateral o en las tarjetas para comenzar tu aprendizaje.</p>
              
              <ModuleList 
                modules={data.modulos} 
                onModuleClick={(id) => setActiveModuleId(id)} 
              />
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-10 rounded-2xl shadow-lg border border-blue-50 animate-fade-in mt-4 md:mt-0">
              <div className="mb-8 border-b-2 border-acento/20 pb-6">
                <span className="text-sm font-bold text-acentoSecundario tracking-widest uppercase mb-2 block flex items-center gap-2">
                  <span>🌍</span> Módulo {activeModule.numero}
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight font-serif">{activeModule.titulo}</h1>
                <p className="text-gray-600 mt-3 text-lg font-medium">{activeModule.descripcion}</p>
              </div>
              
              <ContentRenderer bloques={activeModule.contenido.bloques} />
              
              <div className="mt-16 pt-8 border-t-2 border-gray-100">
                {(() => {
                  if (!activeModule.actividad) return null;
                  
                  const { tipo, id } = activeModule.actividad;
                  const commonProps = {
                    savedProgress: getActivityProgress(activeModule.id, id),
                    onSubmit: ({ respuestas, calificacion, correctas, total }) => {
                      // Se podría guardar 'correctas' y 'total' en useNotionProgress si se deseara
                      saveActivityProgress(activeModule.id, id, respuestas, calificacion);
                    },
                    onSiguiente: hasNextModule ? handleNextModule : undefined
                  };

                  switch (tipo) {
                    case 'verdadero-falso':
                      return <TrueFalseActivity questions={activeModule.actividad.preguntas} {...commonProps} />;
                    case 'respuesta-libre':
                      return <FreeTextActivity questions={activeModule.actividad.preguntas} {...commonProps} />;
                    case 'matching':
                      return <MatchingActivity pares={activeModule.actividad.pares} {...commonProps} />;
                    default:
                      return (
                        <div className="bg-blue-50 p-8 rounded-xl border border-blue-100 text-center">
                          <h3 className="text-2xl font-bold text-acento mb-2">Actividad Práctica</h3>
                          <p className="text-gray-600 mb-6">La actividad tipo "{tipo}" estará disponible próximamente.</p>
                          <button disabled className="bg-acento text-white px-8 py-3 rounded-lg font-bold opacity-50 cursor-not-allowed">
                            Iniciar Actividad
                          </button>
                        </div>
                      );
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Overlay para mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-10 md:hidden mt-[68px]"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
