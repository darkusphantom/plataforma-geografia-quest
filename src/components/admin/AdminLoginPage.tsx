import { useState, type FormEvent } from 'react';

// Contraseña de admin fija — cambiar según necesidad
const ADMIN_PASSWORD = 'admin2024';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

/**
 * Pantalla de acceso para el panel de administrador.
 * Valida una contraseña fija en el cliente.
 */
export function AdminLoginPage({ onSuccess, onBack }: AdminLoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simular un pequeño delay para evitar brute-force visual
    await new Promise((r) => setTimeout(r, 400));

    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Contraseña incorrecta. Acceso denegado.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      {/* Fondo con patrón de puntos */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23a78bfa' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo / Marca admin */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-xl shadow-purple-900/50 mb-4">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-serif">Panel Admin</h1>
          <p className="text-sm font-bold text-purple-400 uppercase tracking-widest mt-1">
            Plataforma · Geografía 1°
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-1">Acceso Restringido</h2>
          <p className="text-purple-200 text-sm mb-6">
            Introduce la contraseña de administrador para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-semibold text-purple-200 mb-1.5"
              >
                Contraseña de Admin
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-white/10 focus:border-violet-400 focus:outline-none transition-colors text-white font-medium placeholder:text-white/30 disabled:opacity-60"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 bg-red-900/40 text-red-300 text-sm font-medium px-4 py-3 rounded-xl border border-red-500/30"
              >
                <span className="flex-shrink-0">🚫</span>
                {error}
              </div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  <span>🔐</span> Acceder al Panel
                </>
              )}
            </button>
          </form>

          {/* Volver */}
          <button
            id="admin-back-btn"
            onClick={onBack}
            className="mt-5 w-full text-sm text-purple-300 hover:text-white transition-colors font-medium flex items-center justify-center gap-2 py-2"
          >
            <span>←</span> Volver al inicio de estudiantes
          </button>
        </div>
      </div>
    </div>
  );
}
