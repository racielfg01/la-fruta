'use client';

import { useAuthStore } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <Link href="/">
            <Button variant="outline">Volver a la Tienda</Button>
          </Link>
        </div>

        <Card className="p-6 bg-card border border-border">
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Información Personal
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nombre Completo
                  </label>
                  <p className="text-lg text-foreground">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Teléfono
                  </label>
                  <p className="text-lg text-foreground">{user.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Género
                  </label>
                  <p className="text-lg text-foreground">{user.gender}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Fecha de Registro
                  </label>
                  <p className="text-lg text-foreground">
                    {new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                variant="destructive"
                className="w-full"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
