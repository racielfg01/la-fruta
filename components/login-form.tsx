'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';
import { useAuthStore } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [touched, setTouched] = useState({ identifier: false, password: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const isIdentifierValid = formData.identifier.trim().length > 0;
  const isPasswordValid = formData.password.length >= 8;
  const isFormValid = isIdentifierValid && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isFormValid) {
      setError('Completa todos los campos correctamente');
      return;
    }
    setIsLoading(true);
    try {
      const result = await loginAction(formData);
      if (result.success && result.user) {
        setUser(result.user);
        if (result.token) setToken(result.token);
        router.push('/');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Iniciar Sesión</h1>
        <p className="text-muted-foreground">Ingresa con tu correo o teléfono</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Correo o Teléfono</label>
          <Input
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="ejemplo@correo.com o 3001234567"
            className={touched.identifier && !isIdentifierValid ? 'border-destructive' : ''}
          />
          {touched.identifier && !isIdentifierValid && (
            <div className="text-xs text-destructive">Ingresa tu correo o número de teléfono</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-foreground">Contraseña</label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              className={`pr-10 ${touched.password && !isPasswordValid ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {touched.password && !isPasswordValid && (
            <div className="text-xs text-destructive">Mínimo 8 caracteres</div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full gap-2 min-h-[44px]"
          size="lg"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Iniciar Sesión'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}