import React from 'react';
import LoginForm from '@/components/login-form';

export const metadata = {
  title: { absolute: 'Iniciar sesión | MercaToma' },
  description: 'Inicia sesión en tu cuenta de MercaToma',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
