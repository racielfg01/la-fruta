import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signupAction } from '@/app/actions/auth';
import { useAuthStore } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function SignupForm() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({
    name: false, email: false, phone: false, gender: false, password: false, confirmPassword: false
  });

  const isValidName = (v: string) => v.trim().length >= 2;
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v: string) => /^[0-9]{7,15}$/.test(v.replace(/\D/g, ''));
  const isValidGender = (v: string) => ['masculino', 'femenino', 'otro', 'prefiero-no-decir'].includes(v);
  const isValidPassword = (v: string) => v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v);
  const isValidConfirm = (v: string) => v === formData.password;

  const isFormValid =
    isValidName(formData.name) &&
    isValidEmail(formData.email) &&
    isValidPhone(formData.phone) &&
    isValidGender(formData.gender) &&
    isValidPassword(formData.password) &&
    isValidConfirm(formData.confirmPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isFormValid) {
      setError('Completa todos los campos correctamente');
      return;
    }
    setIsLoading(true);
    try {
      const result = await signupAction(formData);
      if (result.success && result.user) {
        setUser(result.user);
        if (result.token) setToken(result.token);
        router.push('/');
      } else {
        setError(result.error || 'Error en el registro');
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
        <h1 className="text-3xl font-bold text-foreground">Crear Cuenta</h1>
        <p className="text-muted-foreground">Únete a MercaToma</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-foreground">Nombre completo</label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.name && !isValidName(formData.name) ? 'border-destructive' : ''}
          />
          {touched.name && !isValidName(formData.name) && <p className="text-xs text-destructive">Mínimo 2 caracteres</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground">Correo electrónico</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.email && !isValidEmail(formData.email) ? 'border-destructive' : ''}
          />
          {touched.email && !isValidEmail(formData.email) && <p className="text-xs text-destructive">Correo inválido</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-foreground">Teléfono</label>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            inputMode="numeric"
            className={touched.phone && !isValidPhone(formData.phone) ? 'border-destructive' : ''}
          />
          {touched.phone && !isValidPhone(formData.phone) && <p className="text-xs text-destructive">7 a 15 dígitos</p>}
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium text-foreground">Género</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full h-11 px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero-no-decir">Prefiero no decir</option>
          </select>
          {touched.gender && !isValidGender(formData.gender) && <p className="text-xs text-destructive">Selecciona una opción</p>}
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium text-foreground">Contraseña</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`pr-10 ${touched.password && !isValidPassword(formData.password) ? 'border-destructive' : ''}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer" tabIndex={-1}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.password && !isValidPassword(formData.password) && (
            <p className="text-xs text-destructive">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="block text-sm font-medium text-foreground">Confirmar contraseña</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`pr-10 ${touched.confirmPassword && !isValidConfirm(formData.confirmPassword) ? 'border-destructive' : ''}`}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer" tabIndex={-1}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.confirmPassword && !isValidConfirm(formData.confirmPassword) && (
            <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full gap-2 min-h-[44px]"
          size="lg"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Registrarse'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}