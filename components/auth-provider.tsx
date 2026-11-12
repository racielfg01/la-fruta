'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-context';
import { refreshUserAction } from '@/app/actions/auth';
import { decideSessionRefresh } from '@/lib/session-refresh';

export function AuthProvider({ children }: { children: ReactNode }) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { token, setUser, setLoading, setSessionValidated, logout } = useAuthStore.getState();
    if (!token) {
      // Sin token, cerrar sesión local por si quedó un usuario persistido
      logout();
      setLoading(false);
      setSessionValidated(true);
      return;
    }
    setLoading(true);
    refreshUserAction(token)
      .then((res) => {
        switch (decideSessionRefresh(res)) {
          case 'accept':
            setUser(res!.user!);
            break;
          case 'logout':
            // El servidor dijo que el token ya no vale: ahí sí se cierra.
            logout();
            break;
          default:
            // No se pudo confirmar la sesión (red caída, 5xx). Se conserva la
            // sesión cacheada en vez de expulsar al usuario del sitio.
            break;
        }
      })
      .catch(() => {
        // Fallo de transporte: tampoco dice nada del token.
      })
      .finally(() => {
        setLoading(false);
        // La sesión queda «sin confirmar» solo mientras espera al servidor.
        setSessionValidated(true);
      });
  }, []);

  // Revalidar al volver a la pestaña: si el dueño cambió los permisos de un
  // rol, quien lo tiene abierto se entera al volver, sin recargar a mano.
  // Solo cuando la pestaña estuvo oculta de verdad (no en el primer render).
  useEffect(() => {
    let wasHidden = false;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        return;
      }
      if (!wasHidden) return;
      wasHidden = false;

      const { token, setUser } = useAuthStore.getState();
      if (!token) return;

      refreshUserAction(token)
        .then((res) => {
          // Un fallo puntual no cierra la sesión (decideSessionRefresh).
          if (decideSessionRefresh(res) === "accept") setUser(res!.user!);
        })
        .catch(() => undefined);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return <>{children}</>;
}
