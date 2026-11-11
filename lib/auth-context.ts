// lib/auth-context.ts
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPushSubscription, unsubscribeFromPush } from './push/client';
import { unsubscribePushAction } from '@/app/actions/notifications';
import type { RolePermissions } from './permissions';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  created_at?: string;
  role_id: number;
  permissions?: RolePermissions;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** `true` mientras la sesión cacheada no ha sido confirmada por el servidor. */
  sessionValidated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionValidated: (validated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      // Tras recargar, la sesión cacheada está sin confirmar: el servidor
      // todavía no ha dicho si el token sigue valiendo.
      sessionValidated: false,
      isLoading: true,
      // Un usuario que llega del servidor confirma la sesión.
      setUser: (user) => set({ user, isAuthenticated: !!user, sessionValidated: true }),
      setToken: (token) => set({ token }),
      setLoading: (loading) =>
        set((state) => (state.isLoading === loading ? state : { isLoading: loading })),
      setSessionValidated: (validated) =>
        set((state) =>
          state.sessionValidated === validated ? state : { sessionValidated: validated },
        ),
      logout: () => {
        const token = get().token;
        if (token) {
          // Baja best-effort: la sesión se cierra aunque el servidor no responda.
          void (async () => {
            try {
              const subscription = await getPushSubscription();
              if (subscription) {
                await unsubscribePushAction(token, subscription.endpoint);
              }
            } catch {
              // sin conexión: se limpia igualmente el dispositivo
            } finally {
              await unsubscribeFromPush().catch(() => undefined);
            }
          })();
        }
        set({ user: null, token: null, isAuthenticated: false, sessionValidated: true });
      },
    }),
    {
      name: 'auth-storage',
      version: 2,
      // Solo se persiste lo que sobrevive a una recarga. `isLoading` y
      // `sessionValidated` NO se persisten: tras rehidratar, la sesión está
      // sin validar hasta que el servidor responde.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: any, version: number) => {
        const s = (persistedState?.state ?? persistedState ?? {}) as Partial<AuthStore>;
        return {
          user: s.user ?? null,
          token: s.token ?? null,
          isAuthenticated: !!s.user,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
