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

      {/* Advanced Attributes (HU-7 / IA metadata) */}
      <div className="flex flex-col gap-2 border-[2px] border-black p-3 bg-white">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-gray-500">Atributos Avanzados</span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {metadata.climaClo !== undefined && metadata.climaClo !== null && (
            <div className="border border-black p-2 bg-[#F9F9F9] flex flex-col justify-between">
              <span className="font-mono text-[8px] text-gray-500 uppercase">Aislamiento (clo)</span>
              <span className="font-mono text-xs font-bold text-black mt-0.5">
                {metadata.climaClo} {metadata.climaClo >= 0.4 ? '❄️ (Frío)' : '☀️ (Cálido)'}
              </span>
            </div>
          )}
          {metadata.impermeabilidad && (
            <div className="border border-black p-2 bg-[#F9F9F9] flex flex-col justify-between">
              <span className="font-mono text-[8px] text-gray-500 uppercase">Impermeabilidad</span>
              <span className="font-mono text-xs font-bold text-black mt-0.5">
                {metadata.impermeabilidad} {metadata.impermeabilidad !== 'Sin Proteccion' ? '🌧️' : '☀️'}
              </span>
            </div>
          )}
          {metadata.capaPosicion && (
            <div className="border border-black p-2 bg-[#F9F9F9] flex flex-col justify-between">
              <span className="font-mono text-[8px] text-gray-500 uppercase">Capa / Posición</span>
              <span className="font-mono text-xs font-bold text-black mt-0.5">
                {metadata.capaPosicion}
              </span>
            </div>
          )}
          {metadata.rolCapsula && (
            <div className="border border-black p-2 bg-[#F9F9F9] flex flex-col justify-between">
              <span className="font-mono text-[8px] text-gray-500 uppercase">Rol Cápsula</span>
              <span className="font-mono text-xs font-bold text-black mt-0.5">
                {metadata.rolCapsula}
              </span>
            </div>
          )}
          {metadata.texturaMaterial && (
            <div className="border border-black p-2 bg-[#F9F9F9] col-span-2 flex flex-col justify-between">
              <span className="font-mono text-[8px] text-gray-500 uppercase">Textura y Material</span>
              <span className="font-mono text-xs font-bold text-black mt-0.5">
                {metadata.texturaMaterial}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ocasiones de Uso */}
      {metadata.ocasiones && metadata.ocasiones.length > 0 && (
        <div className="flex flex-col gap-2 border-[2px] border-black p-3 bg-white">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[1px] text-gray-500">Ocasiones de Uso</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {metadata.ocasiones.map((ocasion) => (
              <Badge key={ocasion} variant="outline" className="border-black font-semibold bg-[#FFFF00]/10 text-black">
                {ocasion}
              </Badge>
            ))}
          </div>
        </div>
      )}

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
