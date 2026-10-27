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
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ isLoading: loading }),
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
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return { ...persistedState, isLoading: false };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);