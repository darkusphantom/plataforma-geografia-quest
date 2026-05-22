import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook para consumir el contexto de autenticación.
 * Debe usarse dentro de un componente envuelto en `<AuthProvider>`.
 *
 * @returns {{ user, isLoading, error, login, register, logout }}
 * @example
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  return useContext(AuthContext);
}
