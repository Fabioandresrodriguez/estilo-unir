'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PrendaCarouselProps {
  imagenes: string[];
  nombre: string;
}

export function PrendaCarousel({ imagenes, nombre }: PrendaCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const hasMultipleImages = imagenes.length > 1;

  return (
    <div className="w-full flex flex-col gap-3 font-sans select-none">
      
      {/* Main Carousel Wrapper */}
      <div className="relative border-[3px] border-black bg-white group">
        <Carousel 
          setApi={setApi} 
          className="w-full"
          opts={{ loop: true }}
        >
          <CarouselContent className="-ml-0">
            {imagenes.map((imgUrl, index) => (
              <CarouselItem key={index} className="pl-0 relative aspect-[3/4] w-full">
                <Image
                  src={imgUrl}
                  alt={`Foto de la prenda: ${nombre} - Imagen ${index + 1} de ${imagenes.length}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                  priority={index === 0}
                  className="object-cover"
                />
                
                {/* Click to open Fullscreen */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  aria-label="Abrir imagen en pantalla completa"
                  className="absolute bottom-3 right-3 bg-white text-black p-2 border-[2px] border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Maximize2 className="size-4" />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows (Only on desktop and multiple images) */}
          {hasMultipleImages && (
            <>
              <CarouselPrevious className="hidden md:flex left-3 bg-white hover:bg-black hover:text-white border-[3px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
              <CarouselNext className="hidden md:flex right-3 bg-white hover:bg-black hover:text-white border-[3px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            </>
          )}
        </Carousel>
      </div>

      {/* Progress Dots Indicator (for multiple images) */}
      {hasMultipleImages && (
        <div className="flex items-center justify-between border-[2px] border-black p-2 bg-[#F0F0F0] font-mono text-[11px] font-bold uppercase tracking-[1px] text-black">
          <span>Imagen {current + 1} de {count}</span>
          <div className="flex gap-1.5">
            {Array.from({ length: count }).map((_, index) => {
              const isActive = current === index;
              return (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "size-3 border-[2px] border-black transition-all",
                    isActive ? "bg-black" : "bg-white hover:bg-black/20"
                  )}
                  aria-label={`Ir a la imagen ${index + 1}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col justify-center items-center p-4">
          
          {/* Close button */}
          <button
            onClick={() => setIsFullscreen(false)}
            aria-label="Cerrar pantalla completa"
            className="absolute top-4 right-4 bg-white text-black p-3 border-[3px] border-black hover:bg-[#FF0000] hover:text-white transition-all font-mono font-bold uppercase tracking-[1px] text-[12px] shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            Cerrar [ESC]
          </button>

          {/* Carousel inside Fullscreen */}
          <div className="relative w-full max-w-lg aspect-[3/4] border-[5px] border-white bg-white">
            <Image
              src={imagenes[current]}
              alt={`Imagen expandida de la prenda: ${nombre}`}
              fill
              className="object-cover"
              unoptimized
            />

            {/* Navigation buttons inside fullscreen */}
            {hasMultipleImages && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                <button
                  onClick={() => api?.scrollPrev()}
                  className="pointer-events-auto bg-white text-black p-2 border-[2px] border-black hover:bg-black hover:text-white transition-all"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  onClick={() => api?.scrollNext()}
                  className="pointer-events-auto bg-white text-black p-2 border-[2px] border-black hover:bg-black hover:text-white transition-all"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="size-6" />
                </button>
              </div>
            )}
          </div>

          <span className="text-white mt-4 font-mono text-[12px] uppercase tracking-[1px]">
            {nombre} — {current + 1} / {imagenes.length}
          </span>
        </div>
      )}
    </div>
  );
}
