import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthPageProps {
  onToggle: () => void;
}

/**
 * Pantalla de inicio de sesión.
 * Diseño mobile-first, glassmorphism, consistente con la paleta del proyecto.
 *
 * @param onToggle - Callback para cambiar al modo de registro
 */
export function LoginPage({ onToggle }: AuthPageProps) {
  const { login, isLoading, error } = useAuth();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(cedula, password);
  };

  const isDisabled = isLoading || !cedula.trim() || !password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 bg-topografico">
      <div className="w-full max-w-md">

        {/* Logo / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-200 mb-4">
            <span className="text-4xl">🌍</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-serif">Atlas</h1>
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-1">Geografía 1°</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-6">Inicia sesión para continuar tu aprendizaje.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Cédula */}
            <div>
              <label htmlFor="login-cedula" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Número de Cédula
              </label>
              <input
                id="login-cedula"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                placeholder="Ej: 12345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 font-medium bg-white placeholder:text-gray-400 disabled:opacity-60"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 font-medium bg-white placeholder:text-gray-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100"
              >
                <span className="flex-shrink-0">⚠️</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isDisabled}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 mt-2"
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
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Toggle a registro */}
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <button
              id="go-to-register"
              onClick={onToggle}
              className="text-blue-600 font-semibold hover:underline focus:outline-none"
            >
              Regístrate aquí
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Plataforma educativa · Geografía Primer Año
        </p>
      </div>
    </div>
  );
}
