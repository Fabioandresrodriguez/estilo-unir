'use client';

import React, { useOptimistic, useTransition, useState, useEffect } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bulkUpdatePrendaEstadoAction } from '@/app/actions/prenda-actions';
import { IPrenda, EstadoPrenda } from '@/types/prenda';
import { ConsoleRow } from './ConsoleRow';
import { BulkActionBanner } from './BulkActionBanner';
import { AlertCircle, CheckCircle2, Sparkles, Trash2, WashingMachine } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConsolaAdministracion({ prendasIniciales }: { prendasIniciales: IPrenda[] }) {
  const [prendas, setPrendas] = useState<IPrenda[]>(prendasIniciales);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync state if initial props change
  useEffect(() => {
    setPrendas(prendasIniciales);
  }, [prendasIniciales]);

  // useOptimistic for immediate, lag-free UI transitions
  const [optimisticPrendas, setOptimisticPrendas] = useOptimistic(
    prendas,
    (state, update: { ids: string[]; nuevoEstado: EstadoPrenda }) =>
      state.map((prenda) =>
        prenda._id && update.ids.includes(prenda._id)
          ? { ...prenda, estado: update.nuevoEstado }
          : prenda
      )
  );

  // Hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Bulk status update action handler
  const handleBulkStatusChange = async (ids: string[], nuevoEstado: EstadoPrenda) => {
    setSelectedIds([]); // Clear selections
    
    startTransition(async () => {
      // 1. Apply optimistic change immediately on client UI
      setOptimisticPrendas({ ids, nuevoEstado });

      // 2. Perform actual server mutation
      const result = await bulkUpdatePrendaEstadoAction(ids, nuevoEstado);

      if (result.success) {
        // 3. Confirm baseline state update on success
        setPrendas((prev) =>
          prev.map((prenda) =>
            prenda._id && ids.includes(prenda._id) ? { ...prenda, estado: nuevoEstado } : prenda
          )
        );
        setToast({
          message: `Se actualizaron ${ids.length} prendas con éxito.`,
          type: 'success'
        });
      } else {
        // useOptimistic automatically reverts to baseline state if result is unsuccessful
        setToast({
          message: result.message || 'Error al actualizar las prendas.',
          type: 'error'
        });
      }
    });
  };

  const disponibles = optimisticPrendas.filter(p => p.estado === 'Disponible');
  const fueraDeCirculacion = optimisticPrendas.filter(p => p.estado === 'Sucio' || p.estado === 'Lavandería');

  // Multi-select toggle helpers
  const handleSelectAll = (checked: boolean, list: IPrenda[]) => {
    if (checked) {
      const idsToAdd = list.map(p => p._id!).filter(id => id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
    } else {
      const idsToRemove = list.map(p => p._id!);
      setSelectedIds(prev => prev.filter(id => !idsToRemove.includes(id)));
    }
  };

  const isAllSelected = (list: IPrenda[]) => {
    if (list.length === 0) return false;
    return list.every(p => selectedIds.includes(p._id!));
  };

  return (
    <div className="relative pb-32 font-sans select-none text-black">
      
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[120] p-4 border-[3px] border-black font-mono font-bold uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[12px] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300",
          toast.type === 'success' ? 'bg-[#008000] text-white' : 'bg-[#FF0000] text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tabs list divider */}
      <Tabs defaultValue="disponibles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[500px] border-[3px] border-black p-1 bg-black gap-1 mb-8 h-[54px] rounded-none">
          <TabsTrigger 
            value="disponibles"
            className="rounded-none border-none py-2 font-heading text-[12px] sm:text-[14px] uppercase tracking-[1px] text-white data-active:bg-white data-active:text-black transition-all cursor-pointer"
          >
            Disponibles ({disponibles.length})
          </TabsTrigger>
          <TabsTrigger 
            value="sucias"
            className="rounded-none border-none py-2 font-heading text-[12px] sm:text-[14px] uppercase tracking-[1px] text-white data-active:bg-white data-active:text-black transition-all cursor-pointer"
          >
            Ropa Sucia ({fueraDeCirculacion.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Disponibles */}
        <TabsContent value="disponibles" className="animate-in fade-in duration-300 outline-none">
          
          {/* Desktop Table View */}
          <div className="hidden md:block border-[3px] border-black bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F0F0F0] border-b-[3px] border-black">
                <TableRow>
                  <TableHead className="w-[50px] border-r-[3px] border-black text-center">
                    <Checkbox 
                      checked={isAllSelected(disponibles)}
                      onCheckedChange={(checked) => handleSelectAll(!!checked, disponibles)}
                      aria-label="Seleccionar todas las prendas disponibles"
                    />
                  </TableHead>
                  <TableHead className="w-[80px] border-r-[3px] border-black">Mini</TableHead>
                  <TableHead className="border-r-[3px] border-black font-heading text-[11px] uppercase tracking-[1px]">Prenda</TableHead>
                  <TableHead className="border-r-[3px] border-black font-heading text-[11px] uppercase tracking-[1px]">Categoría</TableHead>
                  <TableHead className="text-right font-heading text-[11px] uppercase tracking-[1px]">Acción Rápida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disponibles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 font-mono text-gray-500 uppercase text-[12px]">
                      No hay prendas disponibles en este momento.
                    </TableCell>
                  </TableRow>
                ) : (
                  disponibles.map(prenda => (
                    <ConsoleRow 
                      key={prenda._id} 
                      prenda={prenda} 
                      isSelected={selectedIds.includes(prenda._id!)}
                      onSelect={(checked) => {
                        setSelectedIds(prev => checked ? [...prev, prenda._id!] : prev.filter(id => id !== prenda._id));
                      }}
                      onStatusChange={(id, estado) => handleBulkStatusChange([id], estado)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="flex flex-col gap-3 md:hidden">
            {disponibles.length === 0 ? (
              <div className="text-center py-8 border-[3px] border-black bg-white font-mono text-gray-500 uppercase text-[11px]">
                No hay prendas disponibles.
              </div>
            ) : (
              disponibles.map(prenda => (
                <MobileConsoleCard 
                  key={prenda._id}
                  prenda={prenda}
                  isSelected={selectedIds.includes(prenda._id!)}
                  onSelect={(checked) => {
                    setSelectedIds(prev => checked ? [...prev, prenda._id!] : prev.filter(id => id !== prenda._id));
                  }}
                  onStatusChange={(id, estado) => handleBulkStatusChange([id], estado)}
                />
              ))
            )}
          </div>

        </TabsContent>

        {/* Tab 2: Ropa Sucia / Fuera de Circulación */}
        <TabsContent value="sucias" className="animate-in fade-in duration-300 outline-none">
          
          {/* Desktop Table View */}
          <div className="hidden md:block border-[3px] border-black bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F0F0F0] border-b-[3px] border-black">
                <TableRow>
                  <TableHead className="w-[50px] border-r-[3px] border-black text-center">
                    <Checkbox 
                      checked={isAllSelected(fueraDeCirculacion)}
                      onCheckedChange={(checked) => handleSelectAll(!!checked, fueraDeCirculacion)}
                      aria-label="Seleccionar toda la ropa sucia"
                    />
                  </TableHead>
                  <TableHead className="w-[80px] border-r-[3px] border-black">Mini</TableHead>
                  <TableHead className="border-r-[3px] border-black font-heading text-[11px] uppercase tracking-[1px]">Prenda</TableHead>
                  <TableHead className="border-r-[3px] border-black font-heading text-[11px] uppercase tracking-[1px]">Categoría</TableHead>
                  <TableHead className="text-right font-heading text-[11px] uppercase tracking-[1px]">Acción Rápida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fueraDeCirculacion.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 font-mono text-gray-500 uppercase text-[12px]">
                      No hay prendas fuera de circulación (sucias o en lavandería).
                    </TableCell>
                  </TableRow>
                ) : (
                  fueraDeCirculacion.map(prenda => (
                    <ConsoleRow 
                      key={prenda._id} 
                      prenda={prenda} 
                      isSelected={selectedIds.includes(prenda._id!)}
                      onSelect={(checked) => {
                        setSelectedIds(prev => checked ? [...prev, prenda._id!] : prev.filter(id => id !== prenda._id));
                      }}
                      onStatusChange={(id, estado) => handleBulkStatusChange([id], estado)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="flex flex-col gap-3 md:hidden">
            {fueraDeCirculacion.length === 0 ? (
              <div className="text-center py-8 border-[3px] border-black bg-white font-mono text-gray-500 uppercase text-[11px]">
                No hay prendas fuera de circulación.
              </div>
            ) : (
              fueraDeCirculacion.map(prenda => (
                <MobileConsoleCard 
                  key={prenda._id}
                  prenda={prenda}
                  isSelected={selectedIds.includes(prenda._id!)}
                  onSelect={(checked) => {
                    setSelectedIds(prev => checked ? [...prev, prenda._id!] : prev.filter(id => id !== prenda._id));
                  }}
                  onStatusChange={(id, estado) => handleBulkStatusChange([id], estado)}
                />
              ))
            )}
          </div>

        </TabsContent>
      </Tabs>

      {/* Floating Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <BulkActionBanner 
          selectedCount={selectedIds.length} 
          onBulkAction={(actionEstado) => handleBulkStatusChange(selectedIds, actionEstado)}
        />
      )}
    </div>
  );
}

// Mobile responsive card layout helper
function MobileConsoleCard({ 
  prenda, 
  isSelected, 
  onSelect, 
  onStatusChange 
}: { 
  prenda: IPrenda; 
  isSelected: boolean; 
  onSelect: (checked: boolean) => void; 
  onStatusChange: (id: string, nuevoEstado: EstadoPrenda) => void;
}) {
  const hasImages = prenda.imagenes && prenda.imagenes.length > 0;
  
  // Use proxy for images to support S3 auth
  const rawImage = hasImages ? prenda.imagenes[0] : '/placeholder.png';
  const proxiedImage = (rawImage.startsWith('/') || rawImage.startsWith('data:'))
    ? rawImage
    : `/api/proxy-image?url=${encodeURIComponent(rawImage)}`;

  const isDisponible = prenda.estado === 'Disponible';

  const handleQuickAction = () => {
    if (isDisponible) {
      onStatusChange(prenda._id!, 'Sucio');
    } else {
      onStatusChange(prenda._id!, 'Disponible');
    }
  };

  return (
    <div className="flex items-center justify-between border-[3px] border-black bg-white p-3 gap-3">
      {/* Checkbox */}
      <div className="flex items-center justify-center shrink-0 w-8">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(checked) => onSelect(!!checked)}
          aria-label={`Seleccionar ${prenda.nombre}`}
        />
      </div>

      {/* Thumbnail */}
      <div className="relative size-[60px] border-[2px] border-black bg-[#F5F5F5] overflow-hidden shrink-0">
        <Image
          src={proxiedImage}
          alt={prenda.nombre}
          fill
          unoptimized
          sizes="60px"
          className="object-cover"
        />
      </div>

      {/* Info details */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 select-none">
        <span className="font-sans font-bold uppercase text-[12px] text-black leading-tight truncate">
          {prenda.nombre}
        </span>
        <div className="flex flex-wrap gap-1 items-center">
          <span className="font-mono text-[9px] text-gray-500">Talla {prenda.metadata.talla}</span>
          <span className="font-mono text-[9px] text-gray-400">//</span>
          <span className={cn(
            "font-mono text-[9px] uppercase tracking-[0.5px] font-semibold",
            prenda.estado === 'Disponible' 
              ? "text-[#008000]" 
              : prenda.estado === 'Sucio'
              ? "text-[#FFA500]"
              : "text-[#FF0000]"
          )}>
            {prenda.estado}
          </span>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="shrink-0">
        {isDisponible ? (
          <Button 
            variant="destructive" 
            size="icon"
            onClick={handleQuickAction}
            className="size-[36px] bg-red-500 border-[2px] border-black text-white hover:bg-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Usar prenda (enviar a ropa sucia)"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="icon"
            onClick={handleQuickAction}
            className="size-[36px] bg-[#008000] border-[2px] border-black text-white hover:bg-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Marcar como limpio"
          >
            <Sparkles className="size-4" />
          </Button>
        )}
      </div>

    </div>
  );
}
