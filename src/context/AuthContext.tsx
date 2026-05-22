import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loginEstudiante, registrarEstudiante, type Student } from '../services/notionService';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Estudiante autenticado. null si no hay sesión activa. */
  user: Student | null;
  /** true mientras se procesa una operación de auth */
  isLoading: boolean;
  /** Mensaje de error del último intento de auth */
  error: string | null;
  /**
   * Inicia sesión con cédula y contraseña.
   * @returns true si el login fue exitoso
   */
  login: (cedula: string, password: string) => Promise<boolean>;
  /**
   * Registra un nuevo estudiante.
   * @returns true si el registro fue exitoso
   */
  register: (cedula: string, password: string) => Promise<boolean>;
  /** Cierra la sesión actual */
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});

const SESSION_KEY = 'geo_session';

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * Provider que gestiona la autenticación de estudiantes.
 * Persiste la sesión en sessionStorage para que sobreviva recargas
 * pero se limpie al cerrar el tab.
 *
 * @param children - Árbol de componentes hijos
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sesión al montar
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setUser(JSON.parse(stored) as Student);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const persistSession = (student: Student) => {
    setUser(student);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(student));
  };

  /**
   * Autenticar estudiante con cédula y contraseña.
   */
  const login = useCallback(async (cedula: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const student = await loginEstudiante(cedula, password);
      persistSession(student);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registrar nuevo estudiante y autenticarlo automáticamente.
   */
  const register = useCallback(async (cedula: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const student = await registrarEstudiante(cedula, password);
      persistSession(student);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cerrar sesión: limpia el estado y sessionStorage.
   */
  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
