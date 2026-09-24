'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  const router = useRouter();

  const handleReset = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center border-[5px] border-black bg-white p-8 sm:p-16 text-center select-none my-8">
      {/* Brutalist hanger SVG representation */}
      <div className="size-24 sm:size-32 bg-[#F0F0F0] border-[3px] border-black flex items-center justify-center mb-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 100 100" 
          className="size-16 sm:size-20 fill-none stroke-black stroke-[4] stroke-linecap-square"
        >
          {/* Hanger Hook */}
          <path d="M 50 45 C 50 30, 60 25, 60 20 C 60 12, 50 12, 50 20 L 50 45 Z" strokeWidth="4" />
          {/* Hanger Base */}
          <path d="M 20 60 L 50 45 L 80 60 Z" strokeWidth="4" />
          <line x1="20" y1="60" x2="80" y2="60" strokeWidth="4" />
          {/* Empty dashed cloth lines representing nothingness */}
          <line x1="35" y1="68" x2="65" y2="68" strokeWidth="3" strokeDasharray="4,4" className="opacity-60" />
          <line x1="40" y1="76" x2="60" y2="76" strokeWidth="3" strokeDasharray="4,4" className="opacity-60" />
        </svg>
      </div>

      {/* Main Text */}
      <h3 className="text-xl sm:text-2xl font-heading font-normal uppercase tracking-[0.5px] text-black mb-4 max-w-lg leading-tight">
        No encontramos prendas con esos filtros
      </h3>

      {/* Description */}
      <p className="font-sans text-sm text-gray-600 max-w-md mb-8 leading-relaxed">
        Intenta modificando los términos de búsqueda, cambiando los filtros seleccionados o reinicia la vista para explorar tu catálogo completo.
      </p>

      {/* Action Button */}
      <Button 
        variant="default" 
        onClick={handleReset}
        className="w-full sm:w-auto"
      >
        Reiniciar Vista [Limpiar Filtros]
      </Button>
    </div>
  );
}
