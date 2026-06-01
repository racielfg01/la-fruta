'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';
import { useAuthStore } from '@/lib/auth-context';
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
        <h1 className="text-3xl font-bold text-green-900">Iniciar Sesión</h1>
        <p className="text-gray-600">Ingresa con tu correo o teléfono</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Correo o Teléfono</label>
          <input
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="ejemplo@correo.com o 3001234567"
            className={`w-full px-4 py-2.5 border rounded-lg transition-colors ${
              touched.identifier && !isIdentifierValid
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
          {touched.identifier && !isIdentifierValid && (
            <div className="text-xs text-red-600">Ingresa tu correo o número de teléfono</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-700">Contraseña</label>
            <Link href="/auth/forgot-password" className="text-xs text-green-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 border rounded-lg pr-10 ${
                touched.password && !isPasswordValid
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white'
              } focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {touched.password && !isPasswordValid && (
            <div className="text-xs text-red-600">Mínimo 8 caracteres</div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            !isFormValid || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Iniciar Sesión'}
        </button>
      </form>

      <p className="text-center text-sm">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/signup" className="text-green-600 font-semibold hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}