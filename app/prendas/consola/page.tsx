import React, { Suspense } from 'react';
import Link from 'next/link';
import { ConsolaAdministracion } from '@/components/consola/ConsolaAdministracion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';

export default function ConsolaPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col gap-6 min-h-screen">
      
      {/* Header wrapper card */}
      <div className="border-[5px] border-black bg-white p-6 sm:p-8 flex flex-col gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-normal uppercase leading-none text-black m-0">
              Consola de Disponibilidad
            </h1>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[1.5px] text-gray-500 mt-1">
              [PANEL OPERATIVO DE CONTROL Y LAVADO EN TIEMPO REAL]
            </span>
          </div>

          <div className="shrink-0">
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="size-4" />
                Volver a la Galería
              </Link>
            </Button>
          </div>
        </div>

        <div className="border-t-[3px] border-black pt-4">
          <p className="font-sans text-sm text-gray-700 leading-relaxed max-w-4xl m-0">
            Utiliza este panel centralizado para gestionar el flujo de lavado de prendas. Selecciona múltiples prendas para realizar actualizaciones de estado de forma masiva o usa los botones rápidos para cambiar estados individuales con un solo clic.
          </p>
        </div>
      </div>

      {/* Main Console Interface */}
      <div className="mt-4">
        <Suspense fallback={
          <div className="font-mono text-sm uppercase p-8 border-[3px] border-black bg-white text-center animate-pulse">
            [Cargando consola de administración...]
          </div>
        }>
          <ConsolaContent />
        </Suspense>
      </div>

    </div>
  );
}

async function ConsolaContent() {
  await connectDB();
  // Fetch all garments in the closet sorted by most recently added
  const prendas = await Prenda.find({}).sort({ createdAt: -1 }).lean();
  const plainPrendas = JSON.parse(JSON.stringify(prendas));

  return <ConsolaAdministracion prendasIniciales={plainPrendas} />;
}
