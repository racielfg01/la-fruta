'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-context';
import { refreshUserAction } from '@/app/actions/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { token, setUser, setLoading, logout } = useAuthStore.getState();
    if (!token) {
      // Sin token, cerrar sesión local por si quedó un usuario persistido
      logout();
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshUserAction(token)
      .then((res) => {
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  return <>{children}</>;
}