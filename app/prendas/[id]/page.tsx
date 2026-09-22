import React, { Suspense } from 'react';
import Link from 'next/link';
import { PrendaDetailContent } from '@/components/detalle/PrendaDetailContent';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/social/BottomNav';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PrendaDetailPage({ params }: PageProps) {
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
            Detalle de Prenda
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white p-4 sm:p-6 select-none overflow-y-auto">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
          
          {/* Detail card container */}
          <div className="border-[5px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <Suspense fallback={<DetailLoadingPlaceholder />}>
              <PrendaDetailLoader params={params} />
            </Suspense>
          </div>

        </div>
      </main>

      {/* Navigation */}
      <BottomNav />

    </div>
  );
}

// Inner server component that awaits params and loads PrendaDetailContent
async function PrendaDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrendaDetailContent prendaId={id} />;
}

// Loading state while the detail parses
function DetailLoadingPlaceholder() {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 bg-white animate-pulse">
      <div className="w-full lg:w-1/2 aspect-[3/4] bg-gray-200 border-[3px] border-black" />
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div className="flex flex-col gap-3 border-b-[3px] border-black pb-3">
          <div className="h-6 bg-gray-200 w-3/4" />
          <div className="h-3 bg-gray-200 w-1/3" />
        </div>
        <div className="h-20 bg-gray-200 border-[3px] border-black" />
        <div className="h-40 bg-gray-200 border-[2px] border-black" />
      </div>
    </div>
  );
}

