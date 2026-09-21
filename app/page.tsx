import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col justify-center min-h-[80vh] select-none">
      
      {/* Contenedor Principal (Tarjeta Brutalista: white fill, 5px black border) */}
      <div className="border-[5px] border-black bg-white p-8 sm:p-12 flex flex-col gap-8">
        
        {/* Encabezado */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl sm:text-[64px] font-heading font-normal uppercase leading-none text-black">
            Clóset Digital
          </h1>
          <p className="font-mono text-sm uppercase tracking-[1px] text-gray-500">
            [SISTEMA DE DIGITALIZACIÓN Y OPERACIÓN DE GUARDARROPA]
          </p>
        </div>

        {/* Descripción */}
        <div className="border-t-[3px] border-black pt-6 flex flex-col gap-4">
          <h4 className="text-xl font-bold font-sans">
            Digitaliza tu ropa de forma ágil y lleva un control operativo de su disponibilidad en tiempo real.
          </h4>
          <p className="text-sm font-sans text-gray-700 leading-relaxed max-w-2xl">
            RawBlock es un sistema brutalista diseñado para organizar prendas de vestir bajo clasificaciones enriquecidas. 
            Permite la carga de fotos en tiempo real mediante la cámara integrada, registro jerárquico de catálogos y gestión operativa del estado de limpieza.
          </p>
        </div>

        {/* Acciones */}
        <div className="border-t-[3px] border-black pt-6 flex flex-col sm:flex-row gap-4">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href="/prendas/registrar">
              Añadir Prenda [HU1]
            </Link>
          </Button>
          
          <Button variant="secondary" className="w-full sm:w-auto cursor-not-allowed" disabled>
            Ver Galería [HU2 - PENDIENTE]
          </Button>

          <Button variant="secondary" className="w-full sm:w-auto cursor-not-allowed" disabled>
            Consola Disponibilidad [HU4 - PENDIENTE]
          </Button>
        </div>

      </div>

      {/* Footer Técnico */}
      <div className="mt-8 text-center sm:text-left">
        <span className="font-mono text-[10px] text-gray-400">
          PROYECTO: CLÓSET DIGITAL MVP // ESTILO: RAWBLOCK BRUTALISTA // ESTADO: HU0 & HU1 COMPLETADOS
        </span>
      </div>

    </div>
  );
}
