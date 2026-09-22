'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { PrendaDetailModal } from '@/components/detalle/PrendaDetailModal';
import { IPrenda } from '@/types/prenda';
import { cn } from '@/lib/utils';

interface PrendaCardProps {
  prenda: IPrenda;
}

// 3:4 aspect ratio placeholder svg encoded in base64 (solid light grey #F0F0F0)
const blurPlaceholder =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzIiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjQiIGZpbGw9IiNGMEYwRjAiLz48L3N2Zz4=';

export function PrendaCard({ prenda }: PrendaCardProps) {
  const router = useRouter();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const isDisponible = prenda.estado === 'Disponible';
  const hasImages = prenda.imagenes && prenda.imagenes.length > 0;
  const mainImage = hasImages ? prenda.imagenes[0] : '/placeholder.png'; // Fallback if no images

  // Determine badge styling based on garment availability
  const estadoBadgeVariant = prenda.estado === 'Disponible' 
    ? 'active' 
    : prenda.estado === 'Sucio'
    ? 'warning'
    : 'error';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept normal left-clicks so middle-clicks / cmd-clicks open in new tab
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      setIsDetailOpen(true);
    }
  };

  return (
    <>
      <Link
        href={`/prendas/${prenda._id}`}
        onClick={handleClick}
        role="gridcell"
        aria-label={`Prenda: ${prenda.nombre}, Talla ${prenda.metadata.talla}, Estado: ${prenda.estado}`}
        className={cn(
          "group block border-[3px] border-black bg-white select-none transition-all duration-300",
          isDisponible 
            ? "hover:-translate-y-1 active:translate-y-0" 
            : "cursor-default" // Non-active hover state for dirty/laundry clothes
        )}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden border-b-[3px] border-black bg-[#F5F5F5]">
          {/* Main garment image */}
          <Image
            src={mainImage}
            alt={prenda.nombre}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            placeholder="blur"
            blurDataURL={blurPlaceholder}
            className={cn(
              "object-cover transition-all duration-300",
              !isDisponible && "opacity-60 grayscale-40 blur-[0.5px]"
            )}
            priority={false}
          />

          {/* Overlay for non-available items */}
          {!isDisponible && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <span className={cn(
                "px-3 py-1.5 font-sans font-extrabold uppercase text-[12px] tracking-[1.5px] border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                prenda.estado === 'Sucio' 
                  ? "bg-[#FFA500] text-black" 
                  : "bg-[#FF0000] text-white"
              )}>
                {prenda.estado}
              </span>
            </div>
          )}

          {/* Floating status / category badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            <Badge variant={estadoBadgeVariant}>
              {prenda.estado}
            </Badge>
          </div>

          {/* Size tag */}
          <div className="absolute bottom-2 right-2">
            <span className="bg-black text-white text-[10px] font-mono font-bold uppercase tracking-[1px] px-2 py-0.5 border border-white">
              Talla {prenda.metadata.talla}
            </span>
          </div>
        </div>

        {/* Card Info Section */}
        <div className="p-3 flex flex-col gap-2">
          <h3 className="font-sans font-bold text-sm uppercase tracking-[0.5px] line-clamp-1 text-black">
            {prenda.nombre}
          </h3>
          
          {/* Colors representation */}
          <div className="flex flex-wrap gap-1">
            {prenda.metadata.colores.map((color) => (
              <span 
                key={color} 
                className="text-[9px] font-mono font-semibold uppercase tracking-[0.5px] bg-[#F0F0F0] text-black border border-black/30 px-1 py-0.5"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Responsive Detail Modal Dialog / Drawer */}
      {isDetailOpen && (
        <PrendaDetailModal
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          prendaId={prenda._id!}
          onStatusChange={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
