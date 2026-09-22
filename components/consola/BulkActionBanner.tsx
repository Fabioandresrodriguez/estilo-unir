'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { EstadoPrenda } from '@/types/prenda';
import { Sparkles, Trash2, WashingMachine } from 'lucide-react';

interface BulkActionBannerProps {
  selectedCount: number;
  onBulkAction: (actionEstado: EstadoPrenda) => void;
}

export function BulkActionBanner({ 
  selectedCount, 
  onBulkAction 
}: BulkActionBannerProps) {
  return (
    <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-7xl z-40 bg-white/95 backdrop-blur-md border-t-[5px] border-x-[5px] border-black p-4 shadow-[0_-8px_0px_0px_rgba(0,0,0,0.05)] select-none font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Count Indicator */}
        <div className="flex items-center gap-3">
          <div className="size-8 bg-black text-white flex items-center justify-center font-mono font-bold text-[14px] border-[2px] border-black">
            {selectedCount}
          </div>
          <span className="font-heading text-[12px] uppercase tracking-[1px] text-black">
            Prendas seleccionadas para cambios masivos
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Action 1: Mark as Clean */}
          <button
            onClick={() => onBulkAction('Disponible')}
            className="flex-1 md:flex-none h-[44px] px-[20px] bg-[#008000] text-white hover:bg-black hover:text-[#008000] border-[3px] border-black font-mono font-bold uppercase tracking-[1px] text-[12px] flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
          >
            <Sparkles className="size-4" />
            Marcar Limpias [Disponible]
          </button>

          {/* Action 2: Mark as Dirty */}
          <button
            onClick={() => onBulkAction('Sucio')}
            className="flex-1 md:flex-none h-[44px] px-[20px] bg-[#FFA500] text-black hover:bg-black hover:text-[#FFA500] border-[3px] border-black font-mono font-bold uppercase tracking-[1px] text-[12px] flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
          >
            <WashingMachine className="size-4" />
            Marcar Sucias [Sucio]
          </button>

          {/* Action 3: Mark to Laundry */}
          <button
            onClick={() => onBulkAction('Lavandería')}
            className="flex-1 md:flex-none h-[44px] px-[20px] bg-[#FF0000] text-white hover:bg-black hover:text-[#FF0000] border-[3px] border-black font-mono font-bold uppercase tracking-[1px] text-[12px] flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
          >
            <Trash2 className="size-4" />
            Lavandería
          </button>
        </div>

      </div>
    </div>
  );
}
