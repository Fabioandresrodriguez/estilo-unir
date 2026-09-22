'use client';

import React, { useOptimistic, useTransition, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string | null>(null);

  const totalPrendasCount = optimisticPrendas.length;
  const disponiblesCount = optimisticPrendas.filter(p => p.estado === 'Disponible').length;
  const suciasCount = optimisticPrendas.filter(p => p.estado === 'Sucio' || p.estado === 'Lavandería').length;

  const filteredPrendas = optimisticPrendas.filter(prenda => {
    const matchesSearch = prenda.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (prenda.metadata?.notas && prenda.metadata.notas.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCatFilter || prenda.metadata?.categoria === selectedCatFilter;
    return matchesSearch && matchesCategory;
  });

  const disponibles = filteredPrendas.filter(p => p.estado === 'Disponible');
  const fueraDeCirculacion = filteredPrendas.filter(p => p.estado === 'Sucio' || p.estado === 'Lavandería');

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

      {/* Profile Header & Stats Card */}
      <div className="border-[5px] border-black bg-white p-6 flex flex-col gap-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="size-16 border-[4px] border-black bg-black text-white flex items-center justify-center font-heading text-3xl select-none shrink-0">
            D
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl sm:text-2xl font-heading uppercase tracking-[0.5px] leading-none m-0 text-black">
              DRAGO
            </h2>
            <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[1.5px] text-gray-500">
              [PROPIETARIO DEL CLÓSET DIGITAL]
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 border-t-[3px] border-black pt-5">
          <div className="border-[3px] border-black bg-[#F0F0F0] p-3 flex flex-col items-center justify-center text-center">
            <span className="text-2xl sm:text-3xl font-heading leading-none text-black">
              {totalPrendasCount}
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.5px] text-gray-500 mt-1.5 font-bold">
              PRENDAS
            </span>
          </div>
          <div className="border-[3px] border-black bg-[#F0F0F0] p-3 flex flex-col items-center justify-center text-center">
            <span className="text-2xl sm:text-3xl font-heading leading-none text-[#008000]">
              {disponiblesCount}
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.5px] text-gray-500 mt-1.5 font-bold">
              LIMPIAS
            </span>
          </div>
          <div className="border-[3px] border-black bg-[#F0F0F0] p-3 flex flex-col items-center justify-center text-center">
            <span className="text-2xl sm:text-3xl font-heading leading-none text-[#FF0000]">
              {suciasCount}
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.5px] text-gray-500 mt-1.5 font-bold">
              SUCIAS
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col gap-3 border-[5px] border-black bg-white p-5 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Filtrar Prendas
        </label>
        <input
          type="text"
          placeholder="Buscar por nombre o notas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-xs focus:border-[4px] focus:outline-none w-full"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x mt-1">
          <button
            onClick={() => setSelectedCatFilter(null)}
            className={cn(
              "border-[2px] border-black px-3 py-1 font-mono uppercase text-[9px] tracking-[0.5px] cursor-pointer snap-start shrink-0 transition-colors",
              !selectedCatFilter ? "bg-black text-white" : "bg-white text-black hover:bg-[#F0F0F0]"
            )}
          >
            Todos
          </button>
          {['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCatFilter(selectedCatFilter === cat ? null : cat)}
              className={cn(
                "border-[2px] border-black px-3 py-1 font-mono uppercase text-[9px] tracking-[0.5px] cursor-pointer snap-start shrink-0 transition-colors",
                selectedCatFilter === cat ? "bg-black text-white" : "bg-white text-black hover:bg-[#F0F0F0]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs list divider */}
      <Tabs defaultValue="disponibles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 border-[3px] border-black p-1 bg-black gap-1 mb-6 h-[54px] rounded-none">
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
          
          {/* Select All Helper Bar */}
          {disponibles.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-2 bg-[#F0F0F0] border-[3px] border-black mb-3">
              <Checkbox 
                checked={isAllSelected(disponibles)}
                onCheckedChange={(checked) => handleSelectAll(!!checked, disponibles)}
                id="select-all-disponibles"
              />
              <label htmlFor="select-all-disponibles" className="font-mono text-[10px] uppercase font-bold tracking-[1px] cursor-pointer">
                Seleccionar Todas ({disponibles.length})
              </label>
            </div>
          )}

          {/* Unified Card List View */}
          <div className="flex flex-col gap-3">
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
          
          {/* Select All Helper Bar */}
          {fueraDeCirculacion.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-2 bg-[#F0F0F0] border-[3px] border-black mb-3">
              <Checkbox 
                checked={isAllSelected(fueraDeCirculacion)}
                onCheckedChange={(checked) => handleSelectAll(!!checked, fueraDeCirculacion)}
                id="select-all-sucias"
              />
              <label htmlFor="select-all-sucias" className="font-mono text-[10px] uppercase font-bold tracking-[1px] cursor-pointer">
                Seleccionar Todas ({fueraDeCirculacion.length})
              </label>
            </div>
          )}

          {/* Unified Card List View */}
          <div className="flex flex-col gap-3">
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
      <Link 
        href={`/prendas/${prenda._id}`}
        className="relative size-[60px] border-[2px] border-black bg-[#F5F5F5] overflow-hidden shrink-0 cursor-pointer block"
      >
        <Image
          src={proxiedImage}
          alt={prenda.nombre}
          fill
          unoptimized
          sizes="60px"
          className="object-cover"
        />
      </Link>

      {/* Info details */}
      <Link 
        href={`/prendas/${prenda._id}`}
        className="flex-1 min-w-0 flex flex-col gap-1 select-none cursor-pointer hover:underline"
      >
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
      </Link>

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
