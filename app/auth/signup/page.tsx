import React from 'react';
import SignupForm from '@/components/signup-form';

export const metadata = {
  title: { absolute: 'Crear cuenta | MercaToma' },
  description: 'Crea tu cuenta en MercaToma',
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
