import React, { Suspense } from 'react';
import Link from 'next/link';
import { PrendaDetailContent } from '@/components/detalle/PrendaDetailContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PrendaDetailPage({ params }: PageProps) {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col gap-6 min-h-screen">
      
      {/* Return to gallery action header */}
      <div className="flex justify-start">
        <Button asChild variant="secondary">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Volver a la Galería
          </Link>
        </Button>
      </div>

      {/* Detail card container */}
      <div className="border-[5px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <Suspense fallback={<DetailLoadingPlaceholder />}>
          <PrendaDetailLoader params={params} />
        </Suspense>
      </div>

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
