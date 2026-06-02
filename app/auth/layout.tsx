import React from 'react';
import { Leaf } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Autenticación | MercaToma',
  description: 'Inicia sesión o crea una cuenta en MercaToma',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-green-900 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg shadow-primary/20 overflow-hidden">
                  <Image className="object-cover" src={"/icon-512x512.png"} alt="logo" width={40} height={40} priority/>
                           </div>
            <span className="text-emerald-700">Merca</span><span className="text-red-600">Toma</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
