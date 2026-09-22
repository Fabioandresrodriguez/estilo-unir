import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { FilterPanel } from '@/components/galeria/FilterPanel';
import { PrendaCard } from '@/components/galeria/PrendaCard';
import { EmptyState } from '@/components/galeria/EmptyState';
import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';
import { SlidersHorizontal, ArrowLeft } from 'lucide-react';

export const unstable_instant = { 
  prefetch: 'static',
  unstable_disableValidation: true 
};

interface PageProps {
  searchParams: Promise<{
    categoria?: string;
    subcategoria?: string;
    colores?: string;
    estaciones?: string;
    estilos?: string;
    estado?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function VestidorPage({ searchParams }: PageProps) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col gap-8 min-h-screen pb-24">
      {/* Botón de retorno al inicio y Cabecera del Vestidor */}
      <div className="border-[5px] border-black bg-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="secondary" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="size-4" />
              <span>Inicio</span>
            </Link>
          </Button>
          <h1 className="text-3xl sm:text-5xl font-heading font-normal uppercase leading-none text-black m-0">
            Vestidor
          </h1>
        </div>
        <p className="font-mono text-xs uppercase tracking-[1px] text-gray-500">
          [GALERÍA COMPLETA Y FILTRADO DE PRENDAS]
        </p>
      </div>

      {/* Galería Section */}
      <div id="galeria" className="flex flex-col gap-6">
        <div className="border-[5px] border-black bg-black p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-heading font-normal text-white m-0 uppercase">
            Mi Guardarropa
          </h2>
          
          {/* Mobile Filter Sheet Trigger Button */}
          <div className="lg:hidden w-full sm:w-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  Filtrar y Ordenar
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-md p-6 bg-white overflow-y-auto border-l-[5px] border-black">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-xl font-heading font-normal uppercase">Filtros y Orden</SheetTitle>
                </SheetHeader>
                <Suspense fallback={<div className="font-mono text-xs uppercase p-4">Cargando filtros...</div>}>
                  <FilterPanel />
                </Suspense>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-4">
            <Suspense fallback={<div className="font-mono text-xs uppercase p-4 border-[3px] border-black bg-white">Cargando filtros...</div>}>
              <FilterPanel />
            </Suspense>
          </aside>
          
          {/* Main Grid View */}
          <main className="flex-1 w-full">
            <Suspense fallback={<PrendasSkeleton />}>
              <PrendasGrid searchParams={searchParams} />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Footer Técnico */}
      <div className="mt-8 mb-4 border-t-[3px] border-black pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <span className="font-mono text-[10px] text-gray-400">
          PROYECTO: CLÓSET DIGITAL MVP // ESTILO: RAWBLOCK BRUTALISTA // ESTADO: HU0, HU1, HU2 & HU5 VESTIDOR
        </span>
        <span className="font-mono text-[10px] text-gray-400">
          HECHO EN 2026 // TECNOLOGÍA: NEXT.JS 16 & REACT 19
        </span>
      </div>
    </div>
  );
}

// Skeletons container for loading state
function PrendasSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, idx) => (
        <div key={idx} className="border-[3px] border-black bg-white flex flex-col">
          <div className="relative aspect-[3/4] w-full bg-gray-200 animate-pulse border-b-[3px] border-black" />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-4 bg-gray-200 animate-pulse w-3/4" />
            <div className="flex gap-1">
              <div className="h-3 bg-gray-200 animate-pulse w-10" />
              <div className="h-3 bg-gray-200 animate-pulse w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Server component to fetch filtered clothes
async function PrendasGrid({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  
  // Construct MongoDB Query
  const query: any = {};

  if (params.categoria) {
    query['metadata.categoria'] = params.categoria;
  }
  if (params.subcategoria) {
    query['metadata.subcategoria'] = params.subcategoria;
  }
  if (params.colores) {
    query['metadata.colores'] = { $in: params.colores.split(',') };
  }
  if (params.estaciones) {
    query['metadata.estaciones'] = { $in: params.estaciones.split(',') };
  }
  if (params.estilos) {
    query['metadata.estilo'] = { $in: params.estilos.split(',') };
  }
  if (params.estado) {
    query.estado = params.estado;
  }
  if (params.search) {
    query.$or = [
      { nombre: { $regex: params.search, $options: 'i' } },
      { 'metadata.notas': { $regex: params.search, $options: 'i' } }
    ];
  }

  let sortOption: any = { createdAt: -1 };
  if (params.sort === 'oldest') sortOption = { createdAt: 1 };
  if (params.sort === 'name-asc') sortOption = { nombre: 1 };
  if (params.sort === 'name-desc') sortOption = { nombre: -1 };

  await connectDB();
  const prendas = await Prenda.find(query).sort(sortOption).lean();

  if (prendas.length === 0) {
    return <EmptyState />;
  }

  const proxiedPrendas = JSON.parse(JSON.stringify(prendas)).map((prenda: any) => {
    if (prenda.imagenes) {
      prenda.imagenes = prenda.imagenes.map((img: string) => {
        if (img && !img.startsWith('/') && !img.startsWith('data:')) {
          return `/api/proxy-image?url=${encodeURIComponent(img)}`;
        }
        return img;
      });
    }
    return prenda;
  });

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
      {proxiedPrendas.map((prenda: any) => (
        <PrendaCard 
          key={prenda._id.toString()} 
          prenda={prenda} 
        />
      ))}
    </div>
  );
}
