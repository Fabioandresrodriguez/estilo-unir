'use client';

import React from 'react';
import Image from 'next/image';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IPrenda, EstadoPrenda } from '@/types/prenda';
import { Sparkles, Trash2, WashingMachine } from 'lucide-react';

interface ConsoleRowProps {
  prenda: IPrenda;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onStatusChange: (id: string, nuevoEstado: EstadoPrenda) => void;
}

export function ConsoleRow({ 
  prenda, 
  isSelected, 
  onSelect, 
  onStatusChange 
}: ConsoleRowProps) {
  const hasImages = prenda.imagenes && prenda.imagenes.length > 0;
  
  // Use backend proxy for external images
  const rawImage = hasImages ? prenda.imagenes[0] : '/placeholder.png';
  const proxiedImage = (rawImage.startsWith('/') || rawImage.startsWith('data:'))
    ? rawImage
    : `/api/proxy-image?url=${encodeURIComponent(rawImage)}`;

  const isDisponible = prenda.estado === 'Disponible';

  const handleQuickAction = () => {
    if (isDisponible) {
      // Mandar a ropa sucia
      onStatusChange(prenda._id!, 'Sucio');
    } else {
      // Lavar, marcar como limpia (Disponible)
      onStatusChange(prenda._id!, 'Disponible');
    }
  };

  return (
    <TableRow className="border-b-[3px] border-black bg-white hover:bg-gray-50 select-none">
      
      {/* Checkbox Column */}
      <TableCell className="w-[50px] border-r-[3px] border-black text-center py-2.5">
        <div className="flex items-center justify-center">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(checked) => onSelect(!!checked)}
            aria-label={`Seleccionar ${prenda.nombre}`}
          />
        </div>
      </TableCell>

      {/* Thumbnail Column */}
      <TableCell className="w-[80px] border-r-[3px] border-black p-2">
        <div className="relative size-[60px] border-[2px] border-black bg-[#F5F5F5] overflow-hidden">
          <Image
            src={proxiedImage}
            alt={prenda.nombre}
            fill
            unoptimized
            sizes="60px"
            className="object-cover"
          />
        </div>
      </TableCell>

      {/* Garment Details Column */}
      <TableCell className="font-sans font-bold uppercase text-[13px] text-black border-r-[3px] border-black">
        <div className="flex flex-col gap-0.5">
          <span className="line-clamp-1">{prenda.nombre}</span>
          <span className="font-mono text-[9px] text-gray-500 font-normal">
            Talla: {prenda.metadata.talla} // Estado: {prenda.estado}
          </span>
        </div>
      </TableCell>

      {/* Category Column */}
      <TableCell className="font-sans font-semibold text-[12px] text-black border-r-[3px] border-black hidden sm:table-cell">
        <Badge variant="outline" className="border-black">
          {prenda.metadata.categoria}
        </Badge>
      </TableCell>

      {/* Quick Action Column */}
      <TableCell className="text-right p-3">
        {isDisponible ? (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleQuickAction}
            className="h-[32px] px-3 text-[11px] font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Mandar a ropa sucia"
          >
            <Trash2 className="size-3.5 mr-1" />
            Usar [Sucio]
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm"
            onClick={handleQuickAction}
            className="h-[32px] px-3 text-[11px] font-mono bg-[#008000] text-white hover:bg-black hover:text-[#008000] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Marcar como limpio"
          >
            <Sparkles className="size-3.5 mr-1" />
            Limpiar [OK]
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
