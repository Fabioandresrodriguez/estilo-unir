'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { IMetadataPrenda } from '@/types/prenda';

interface MetadataSectionProps {
  metadata: IMetadataPrenda;
}

export function MetadataSection({ metadata }: MetadataSectionProps) {
  return (
    <div className="flex flex-col gap-5 font-sans text-black">
      
      {/* Category & Subcategory */}
      <div className="flex flex-col gap-2 border-[2px] border-black p-3 bg-[#F0F0F0]">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-gray-500">Clasificación</span>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="border-black font-bold">
            Categoría: {metadata.categoria}
          </Badge>
          <Badge variant="outline" className="border-black font-bold">
            Subcategoría: {metadata.subcategoria}
          </Badge>
          <Badge variant="default" className="bg-black text-white">
            Talla {metadata.talla}
          </Badge>
        </div>
      </div>

      {/* Colors Swatches */}
      <div className="flex flex-col gap-2 border-[2px] border-black p-3 bg-white">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-gray-500">Colores</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {metadata.colores.map((color) => (
            <Badge key={color} variant="outline" className="border-black font-semibold bg-[#F0F0F0]">
              {color}
            </Badge>
          ))}
        </div>
      </div>

      {/* Seasons */}
      <div className="flex flex-col gap-2 border-[2px] border-black p-3 bg-white">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-gray-500">Estación / Clima</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {metadata.estaciones.map((est) => (
            <Badge key={est} variant="outline" className="border-black font-semibold">
              {est}
            </Badge>
          ))}
        </div>
      </div>

      {/* Style / Aesthetic */}
      <div className="flex flex-col gap-2 border-[2px] border-black p-3 bg-white">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-gray-500">Estilos</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {metadata.estilo.map((est) => (
            <Badge key={est} variant="default" className="bg-black text-white">
              {est}
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes */}
      {metadata.notas && (
        <div className="flex flex-col gap-2 border-[2px] border-black p-3 bg-white">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-gray-500">Notas Adicionales</span>
          <p className="text-sm font-sans text-gray-800 leading-relaxed mt-1 italic">
            "{metadata.notas}"
          </p>
        </div>
      )}

    </div>
  );
}
