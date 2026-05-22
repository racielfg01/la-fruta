// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { loginAction } from '@/app/actions/auth';
// import { useAuthStore } from '@/lib/auth-context';
// import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// export default function LoginForm() {
//   const router = useRouter();
//   const { setUser, setToken } = useAuthStore();
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState<string>('');
//   const [success, setSuccess] = useState<string>('');

//   const [formData, setFormData] = useState({
//     phone: '',
//     password: '',
//   });

//   const [validations, setValidations] = useState({
//     phone: { touched: false, valid: false },
//     password: { touched: false, valid: false },
//   });

//   // Real-time validations
//   const validateField = (field: string, value: string) => {
//     let isValid = false;

//     switch (field) {
//       case 'phone':
//         const cleanPhone = value.replace(/\D/g, '');
//         isValid = cleanPhone.length >= 10 && cleanPhone.length <= 15;
//         break;

//       case 'password':
//         isValid = value.length >= 6;
//         break;
//     }

//     setValidations((prev) => ({
//       ...prev,
//       [field]: { touched: true, valid: isValid },
//     }));
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     validateField(name, value);
//   };

//   const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     validateField(name, value);
//   };

//   const isFormValid =
//     validations.phone.valid && validations.password.valid;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');

//     if (!isFormValid) {
//       setError('Por favor completa todos los campos correctamente');
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const result = await loginAction(formData);

//       if (result.success && result.user) {
//         setSuccess(result.message);
//         setUser(result.user);
//         if (result.token) {
//           setToken(result.token);
//         }
//         setFormData({
//           phone: '',
//           password: '',
//         });
//         // Redirect after 2 seconds
//         setTimeout(() => {
//           router.push('/');
//         }, 2000);
//       } else {
//         setError(result.error || 'Error en el inicio de sesión');
//       }
//     } catch (err) {
//       setError('Error al procesar el inicio de sesión. Intenta de nuevo.');
//       console.error('Login error:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-md mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="text-center space-y-2">
//         <h1 className="text-3xl font-bold text-green-900">Iniciar Sesión</h1>
//         <p className="text-gray-600">Bienvenido de vuelta a La Fruta</p>
//       </div>

//       {/* Error Alert */}
//       {error && (
//         <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
//           <AlertCircle className="w-5 h-5 flex-shrink-0" />
//           <span className="text-sm">{error}</span>
//         </div>
//       )}

//       {/* Success Alert */}
//       {success && (
//         <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
//           <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
//           <span className="text-sm">{success}</span>
//         </div>
//       )}

//       {/* Form */}
//       <form onSubmit={handleSubmit} className="space-y-5">
//         {/* Phone */}
//         <div className="space-y-2">
//           <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
//             Teléfono
//           </label>
//           <input
//             type="tel"
//             id="phone"
//             name="phone"
//             value={formData.phone}
//             onChange={handleChange}
//             onBlur={handleBlur}
//             placeholder="3001234567"
//             className={`w-full px-4 py-2.5 border rounded-lg transition-colors ${
//               validations.phone.touched
//                 ? validations.phone.valid
//                   ? 'border-green-500 bg-green-50'
//                   : 'border-red-500 bg-red-50'
//                 : 'border-gray-300 bg-white'
//             } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
//           />
//           {validations.phone.touched && !validations.phone.valid && (
//             <div className="text-xs text-red-600 flex items-center gap-1">
//               ✗ Ingresa un teléfono válido
//             </div>
//           )}
//         </div>

//         {/* Password */}
//         <div className="space-y-2">
//           <div className="flex items-center justify-between">
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//               Contraseña
//             </label>
//             <Link
//               href="/auth/forgot-password"
//               className="text-xs text-green-600 hover:text-green-700 font-semibold"
//             >
//               ¿Olvidaste tu contraseña?
//             </Link>
//           </div>
//           <div className="relative">
//             <input
//               type={showPassword ? 'text' : 'password'}
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               onBlur={handleBlur}
//               placeholder="••••••••"
//               className={`w-full px-4 py-2.5 border rounded-lg transition-colors pr-10 ${
//                 validations.password.touched
//                   ? validations.password.valid
//                     ? 'border-green-500 bg-green-50'
//                     : 'border-red-500 bg-red-50'
//                   : 'border-gray-300 bg-white'
//               } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//             >
//               {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//             </button>
//           </div>
//           {validations.password.touched && !validations.password.valid && (
//             <div className="text-xs text-red-600 flex items-center gap-1">
//               ✗ La contraseña debe tener al menos 6 caracteres
//             </div>
//           )}
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           disabled={!isFormValid || isLoading}
//           className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
//             !isFormValid || isLoading
//               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//               : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
//           }`}
//         >
//           {isLoading ? (
//             <>
//               <Loader2 className="w-5 h-5 animate-spin" />
//               Iniciando sesión...
//             </>
//           ) : (
//             'Iniciar Sesión'
//           )}
//         </button>
//       </form>

//       {/* Signup Link */}
//       <div className="text-center">
//         <p className="text-gray-600 text-sm">
//           ¿No tienes cuenta?{' '}
//           <Link href="/auth/signup" className="text-green-600 font-semibold hover:text-green-700">
//             Regístrate aquí
//           </Link>
//         </p>
//       </div>

//       {/* Demo Credentials */}
//       <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//         <p className="text-xs font-semibold text-blue-900 mb-2">Credenciales de Demo:</p>
//         <p className="text-xs text-blue-700">Teléfono: 3001234567</p>
//         <p className="text-xs text-blue-700">Contraseña: Demo123</p>
//       </div>
//     </div>
//   );
// }


// app/auth/login/page.tsx (o componente LoginForm)
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
  const isPasswordValid = formData.password.length >= 6;
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
            <div className="text-xs text-red-600">Mínimo 6 caracteres</div>
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