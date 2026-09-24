'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, User } from 'lucide-react';
import { Suspense } from 'react';

function BottomNavContent() {
  const pathname = usePathname();
  
  const isInicio = pathname === '/';
  const isRegistrar = pathname === '/prendas/registrar';
  const isPerfil = pathname === '/prendas/consola';

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl bg-white border-t-[5px] border-x-[5px] border-black z-50 h-[64px] flex items-center justify-between px-8 sm:px-16">
      {/* Inicio Link */}
      <Link 
        href="/" 
        className="flex flex-col items-center justify-center text-black hover:text-gray-600 transition-colors py-1 relative"
      >
        <Home className="size-5 stroke-[2.5px]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.5px] font-bold mt-0.5">
          Inicio
        </span>
        {/* Active line indicator */}
        {isInicio && <div className="absolute -bottom-2 w-8 h-[4px] bg-black" />}
      </Link>

      {/* Center: Large black circle button with a white plus sign (+) linking to /prendas/registrar */}
      <div className="relative -translate-y-5">
        <Link 
          href="/prendas/registrar"
          className={`size-14 rounded-full rounded-circle border-[4px] transition-colors flex items-center justify-center active:scale-95 shadow-none ${
            isRegistrar 
              ? 'bg-white text-black border-black hover:bg-black hover:text-white' 
              : 'bg-black border-black text-white hover:bg-white hover:text-black hover:border-black'
          }`}
          aria-label="Registrar nueva prenda"
        >
          <Plus className="size-8 stroke-[3px]" />
        </Link>
      </div>

      {/* Perfil Link */}
      <Link 
        href="/prendas/consola" 
        className="flex flex-col items-center justify-center text-black hover:text-gray-600 transition-colors py-1 relative"
      >
        <User className="size-5 stroke-[2.5px]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.5px] font-bold mt-0.5">
          Perfil
        </span>
        {/* Active line indicator */}
        {isPerfil && <div className="absolute -bottom-2 w-8 h-[4px] bg-black" />}
      </Link>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl bg-white border-t-[5px] border-x-[5px] border-black z-50 h-[64px]" />
    }>
      <BottomNavContent />
    </Suspense>
  );
}


