// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { signupAction } from '@/app/actions/auth';
// import { useAuthStore } from '@/lib/auth-context';
// import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// export default function SignupForm() {
//   const router = useRouter();
//   const { setUser, setToken } = useAuthStore();
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [error, setError] = useState<string>('');
//   const [success, setSuccess] = useState<string>('');

//   const [formData, setFormData] = useState({
//     name: '',
//     phone: '',
//     gender: '',
//     password: '',
//     confirmPassword: '',
//   });

//   const [validations, setValidations] = useState({
//     name: { touched: false, valid: false, message: '' },
//     phone: { touched: false, valid: false, message: '' },
//     gender: { touched: false, valid: false, message: '' },
//     password: { touched: false, valid: false, message: '' },
//     confirmPassword: { touched: false, valid: false, message: '' },
//   });

//   // Real-time validations
//   const validateField = (field: string, value: string) => {
//     let isValid = false;
//     let message = '';

//     switch (field) {
//       case 'name':
//         if (!value || value.trim().length === 0) {
//           message = 'El nombre es requerido';
//         } else if (value.trim().length < 2) {
//           message = 'El nombre debe tener al menos 2 caracteres';
//         } else if (value.length > 100) {
//           message = 'El nombre no debe exceder 100 caracteres';
//         } else {
//           isValid = true;
//         }
//         break;

//       case 'phone':
//         const cleanPhone = value.replace(/\D/g, '');
//         if (!value) {
//           message = 'El teléfono es requerido';
//         } else if (cleanPhone.length < 10) {
//           message = `${cleanPhone.length}/10 dígitos mínimo`;
//         } else if (cleanPhone.length > 15) {
//           message = 'El teléfono es muy largo';
//         } else {
//           isValid = true;
//         }
//         break;

//       case 'gender':
//         if (!value) {
//           message = 'Selecciona un género';
//         } else {
//           isValid = true;
//         }
//         break;

//       case 'password':
//         if (!value) {
//           message = 'La contraseña es requerida';
//         } else if (value.length < 6) {
//           message = `${value.length}/6 caracteres mínimo`;
//         } else if (!/[a-z]/.test(value)) {
//           message = 'Necesita letras minúsculas';
//         } else if (!/[A-Z]/.test(value)) {
//           message = 'Necesita letras mayúsculas';
//         } else if (!/[0-9]/.test(value)) {
//           message = 'Necesita números';
//         } else {
//           isValid = true;
//         }
//         break;

//       case 'confirmPassword':
//         if (!value) {
//           message = 'Confirma la contraseña';
//         } else if (value !== formData.password) {
//           message = 'Las contraseñas no coinciden';
//         } else {
//           isValid = true;
//         }
//         break;
//     }

//     setValidations((prev) => ({
//       ...prev,
//       [field]: { touched: true, valid: isValid, message },
//     }));
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     validateField(name, value);
//   };

//   const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     validateField(name, value);
//   };

//   const isFormValid = Object.values(validations).every((field) => field.valid);

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
//       const result = await signupAction(formData);

//       if (result.success && result.user) {
//         setSuccess(result.message);
//         setUser(result.user);
//         if (result.token) {
//           setToken(result.token);
//         }
//         setFormData({
//           name: '',
//           phone: '',
//           gender: '',
//           password: '',
//           confirmPassword: '',
//         });
//         // Redirect after 2 seconds
//         setTimeout(() => {
//           router.push('/');
//         }, 2000);
//       } else {
//         setError(result.error || 'Error en el registro');
//       }
//     } catch (err) {
//       setError('Error al procesar el registro. Intenta de nuevo.');
//       console.error('Signup error:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-md mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="text-center space-y-2">
//         <h1 className="text-3xl font-bold text-green-900">Crear Cuenta</h1>
//         <p className="text-gray-600">Únete a La Fruta hoy</p>
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
//         {/* Name */}
//         <div className="space-y-2">
//           <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//             Nombre Completo
//           </label>
//           <input
//             type="text"
//             id="name"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             onBlur={handleBlur}
//             placeholder="Juan Pérez"
//             className={`w-full px-4 py-2.5 border rounded-lg transition-colors ${
//               validations.name.touched
//                 ? validations.name.valid
//                   ? 'border-green-500 bg-green-50'
//                   : 'border-red-500 bg-red-50'
//                 : 'border-gray-300 bg-white'
//             } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
//           />
//           {validations.name.touched && (
//             <div className={`text-xs flex items-center gap-1 ${validations.name.valid ? 'text-green-600' : 'text-red-600'}`}>
//               {validations.name.valid ? '✓' : '✗'} {validations.name.message}
//             </div>
//           )}
//         </div>

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
//           {validations.phone.touched && (
//             <div className={`text-xs flex items-center gap-1 ${validations.phone.valid ? 'text-green-600' : 'text-red-600'}`}>
//               {validations.phone.valid ? '✓' : '✗'} {validations.phone.message}
//             </div>
//           )}
//         </div>

//         {/* Gender */}
//         <div className="space-y-2">
//           <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
//             Género
//           </label>
//           <select
//             id="gender"
//             name="gender"
//             value={formData.gender}
//             onChange={handleChange}
//             onBlur={handleBlur}
//             className={`w-full px-4 py-2.5 border rounded-lg transition-colors ${
//               validations.gender.touched
//                 ? validations.gender.valid
//                   ? 'border-green-500 bg-green-50'
//                   : 'border-red-500 bg-red-50'
//                 : 'border-gray-300 bg-white'
//             } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
//           >
//             <option value="">Selecciona tu género</option>
//             <option value="masculino">Masculino</option>
//             <option value="femenino">Femenino</option>
//             <option value="otro">Otro</option>
//             <option value="prefiero-no-decir">Prefiero no decir</option>
//           </select>
//           {validations.gender.touched && (
//             <div className={`text-xs flex items-center gap-1 ${validations.gender.valid ? 'text-green-600' : 'text-red-600'}`}>
//               {validations.gender.valid ? '✓' : '✗'} {validations.gender.message}
//             </div>
//           )}
//         </div>

//         {/* Password */}
//         <div className="space-y-2">
//           <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//             Contraseña
//           </label>
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
//           {validations.password.touched && (
//             <div className={`text-xs flex items-center gap-1 ${validations.password.valid ? 'text-green-600' : 'text-red-600'}`}>
//               {validations.password.valid ? '✓' : '✗'} {validations.password.message}
//             </div>
//           )}
//         </div>

//         {/* Confirm Password */}
//         <div className="space-y-2">
//           <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
//             Confirmar Contraseña
//           </label>
//           <div className="relative">
//             <input
//               type={showConfirmPassword ? 'text' : 'password'}
//               id="confirmPassword"
//               name="confirmPassword"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               onBlur={handleBlur}
//               placeholder="••••••••"
//               className={`w-full px-4 py-2.5 border rounded-lg transition-colors pr-10 ${
//                 validations.confirmPassword.touched
//                   ? validations.confirmPassword.valid
//                     ? 'border-green-500 bg-green-50'
//                     : 'border-red-500 bg-red-50'
//                   : 'border-gray-300 bg-white'
//               } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
//             />
//             <button
//               type="button"
//               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//             >
//               {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//             </button>
//           </div>
//           {validations.confirmPassword.touched && (
//             <div className={`text-xs flex items-center gap-1 ${validations.confirmPassword.valid ? 'text-green-600' : 'text-red-600'}`}>
//               {validations.confirmPassword.valid ? '✓' : '✗'} {validations.confirmPassword.message}
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
//               Registrando...
//             </>
//           ) : (
//             'Crear Cuenta'
//           )}
//         </button>
//       </form>

//       {/* Login Link */}
//       <div className="text-center">
//         <p className="text-gray-600 text-sm">
//           ¿Ya tienes cuenta?{' '}
//           <Link href="/auth/login" className="text-green-600 font-semibold hover:text-green-700">
//             Inicia sesión
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// app/auth/signup/page.tsx (o componente SignupForm)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signupAction } from '@/app/actions/auth';
import { useAuthStore } from '@/lib/auth-context';
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

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name': return value.trim().length >= 2;
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone': return /^[0-9]{8,10}$/.test(value.replace(/\D/g, ''));
      case 'gender': return ['masculino', 'femenino', 'otro', 'prefiero-no-decir'].includes(value);
      case 'password': return value.length >= 6 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
      case 'confirmPassword': return value === formData.password;
      default: return true;
    }
  };

  const isFieldValid = (field: string) => validateField(field, formData[field as keyof typeof formData]);
  const isFormValid = ['name', 'email', 'phone', 'gender', 'password', 'confirmPassword'].every(f => isFieldValid(f));

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
        <h1 className="text-3xl font-bold text-green-900">Crear Cuenta</h1>
        <p className="text-gray-600">Únete a La Fruta</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-2 border rounded-lg ${
              touched.name && !isFieldValid('name') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {touched.name && !isFieldValid('name') && <p className="text-xs text-red-600">Mínimo 2 caracteres</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-2 border rounded-lg ${
              touched.email && !isFieldValid('email') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {touched.email && !isFieldValid('email') && <p className="text-xs text-red-600">Correo inválido</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-2 border rounded-lg ${
              touched.phone && !isFieldValid('phone') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {touched.phone && !isFieldValid('phone') && <p className="text-xs text-red-600">10 a 15 dígitos</p>}
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Género</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">Selecciona</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero-no-decir">Prefiero no decir</option>
          </select>
          {touched.gender && !isFieldValid('gender') && <p className="text-xs text-red-600">Selecciona una opción</p>}
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg pr-10 ${
                touched.password && !isFieldValid('password') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.password && !isFieldValid('password') && (
            <p className="text-xs text-red-600">Mínimo 6 caracteres, una mayúscula, una minúscula y un número</p>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg pr-10 ${
                touched.confirmPassword && !isFieldValid('confirmPassword') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.confirmPassword && !isFieldValid('confirmPassword') && (
            <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            !isFormValid || isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Registrarse'}
        </button>
      </form>

      <p className="text-center text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-green-600 font-semibold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}