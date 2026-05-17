'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    // Check if user was stored in localStorage on mount
    setLoading(false);
  }, [setLoading]);

  return <>{children}</>;
}
