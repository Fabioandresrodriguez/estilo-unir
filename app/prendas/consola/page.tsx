import React, { Suspense } from 'react';
import Link from 'next/link';
import { ConsolaAdministracion } from '@/components/consola/ConsolaAdministracion';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/social/BottomNav';
import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';
import { connection } from 'next/server';

export default function ConsolaPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-h-screen bg-[#F3F4F6] border-x-[5px] border-black pb-[64px]">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-[5px] border-black flex items-center justify-between px-4 h-[64px] w-full shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="h-10 w-10 text-black hover:text-gray-600 transition-colors flex items-center justify-center"
            aria-label="Volver al clóset"
          >
            <ArrowLeft className="size-6 stroke-[2.5px]" />
          </Link>
          <span className="font-heading text-lg tracking-[1px] text-black select-none uppercase">
            Mi Perfil
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white p-4 sm:p-6 select-none overflow-y-auto">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
          
          <Suspense fallback={
            <div className="font-mono text-sm uppercase p-8 border-[3px] border-black bg-white text-center animate-pulse">
              [Cargando consola de administración...]
            </div>
          }>
            <ConsolaContent />
          </Suspense>

        </div>
      </main>

      {/* Navigation */}
      <BottomNav />

    </div>
  );
}

async function ConsolaContent() {
  await connection();
  await connectDB();
  // Fetch all garments in the closet sorted by most recently added
  const prendas = await Prenda.find({}).sort({ createdAt: -1 }).lean();
  const plainPrendas = JSON.parse(JSON.stringify(prendas));

  return <ConsolaAdministracion prendasIniciales={plainPrendas} />;
}


