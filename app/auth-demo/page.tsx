'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-context';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthDemoPage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Sistema de Autenticación</h1>
          <p className="text-lg text-muted-foreground">
            Demostración del sistema completo de autenticación con Neon DB
          </p>
        </div>

        <div className="grid gap-6 mb-12">
          {/* Auth Status */}
          <Card className="p-6 bg-card border border-border">
            <div className="flex items-start gap-4">
              {isAuthenticated ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Estado de Autenticación
                </h2>
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                    <p className="text-foreground">
                      <span className="font-medium">Usuario Autenticado:</span> {user.name}
                    </p>
                    <p className="text-foreground">
                      <span className="font-medium">Teléfono:</span> {user.phone}
                    </p>
                    <p className="text-foreground">
                      <span className="font-medium">Género:</span> {user.gender}
                    </p>
                    <div className="flex gap-4 mt-4">
                      <Link href="/perfil">
                        <Button>Ver Perfil</Button>
                      </Link>
                      <Link href="/">
                        <Button variant="outline">Volver a la Tienda</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      No hay usuario autenticado en este momento.
                    </p>
                    <div className="flex gap-4 mt-4">
                      <Link href="/auth/login">
                        <Button>Iniciar Sesión</Button>
                      </Link>
                      <Link href="/auth/signup">
                        <Button variant="outline">Registrarse</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Demo Credentials */}
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Credenciales de Prueba
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">Teléfono:</p>
                <p className="text-base text-foreground font-mono">3015555555</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">Contraseña:</p>
                <p className="text-base text-foreground font-mono">Demo123</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Puedes usar estas credenciales para probar el sistema de inicio de sesión.
              </p>
            </div>
          </Card>

          {/* Features */}
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Características Implementadas
            </h2>
            <div className="space-y-3">
              {[
                'Registro de usuarios con validación en tiempo real',
                'Hashing seguro de contraseñas con bcryptjs',
                'Validaciones exhaustivas de entrada',
                'Iniciar sesión con teléfono y contraseña',
                'Gestión de sesión con Zustand',
                'Persistencia de sesión en localStorage',
                'Página de perfil protegida',
                'Server actions para operaciones de base de datos',
                'Integración completa con Neon DB',
                'Manejo de errores y mensajes claros',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tech Stack */}
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Stack Tecnológico</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Base de Datos</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Neon DB (PostgreSQL)</li>
                  <li>• Tabla usuarios con índices</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Seguridad</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>• bcryptjs para hashing</li>
                  <li>• Validaciones de entrada</li>
                  <li>• Server actions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Estado</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Zustand para estado global</li>
                  <li>• Persistencia automática</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Frontend</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Next.js 16</li>
                  <li>• React 19</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/">
            <Button variant="outline">Ir a la Tienda</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">Panel de Admin</Button>
          </Link>
          {!isAuthenticated && (
            <>
              <Link href="/auth/signup">
                <Button>Registrarse</Button>
              </Link>
              <Link href="/auth/login">
                <Button>Iniciar Sesión</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
