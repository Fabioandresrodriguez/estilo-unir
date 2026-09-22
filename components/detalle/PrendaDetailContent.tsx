'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getPrendaByIdAction, updatePrendaEstadoAction, deletePrendaAction } from '@/app/actions/prenda-actions';
import { PrendaCarousel } from './PrendaCarousel';
import { MetadataSection } from './MetadataSection';
import { Badge } from '@/components/ui/badge';
import { IPrenda, EstadoPrenda } from '@/types/prenda';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface PrendaDetailContentProps {
  prendaId: string;
  onStatusChange?: (newStatus: EstadoPrenda) => void;
  onClose?: () => void;
}

export function PrendaDetailContent({ prendaId, onStatusChange, onClose }: PrendaDetailContentProps) {
  const router = useRouter();
  const [prenda, setPrenda] = useState<IPrenda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pulseState, setPulseState] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!prenda) return;
    setError(null);
    startDeleteTransition(async () => {
      const result = await deletePrendaAction(prenda._id!);
      if (result.success) {
        setToast({ message: result.message || 'Prenda eliminada con éxito', type: 'success' });
        setTimeout(() => {
          if (onClose) onClose();
          router.push('/');
          router.refresh();
        }, 1500);
      } else {
        setError(result.message || 'Error al eliminar la prenda.');
        setToast({ message: result.message || 'Error al eliminar la prenda.', type: 'error' });
      }
    });
  };

  // Fetch garment details on load
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function fetchDetails() {
      const result = await getPrendaByIdAction(prendaId);
      if (!active) return;
      
      if (result.success && result.prenda) {
        setPrenda(result.prenda);
      } else {
        setError(result.message || 'No se pudo cargar la prenda.');
      }
      setLoading(false);
    }

    fetchDetails();

    return () => {
      active = false;
    };
  }, [prendaId]);

  // Handle status update (Disponible, Sucio, Lavandería)
  const handleStatusUpdate = (newStatus: EstadoPrenda) => {
    if (!prenda) return;
    setError(null);

    // Optimistic background color transition pulse
    setPulseState(true);
    setTimeout(() => setPulseState(false), 800);

    startUpdateTransition(async () => {
      const result = await updatePrendaEstadoAction(prenda._id!, newStatus);
      
      if (result.success && result.prenda) {
        setPrenda(prev => prev ? { ...prev, estado: newStatus } : null);
        
        // Show custom brutalist toast
        setToast({ 
          message: `Prenda marcada como ${newStatus} exitosamente`, 
          type: 'success' 
        });

        // Trigger callback if defined
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } else {
        // Handle error (e.g. item deleted)
        setError(result.message || 'Error al actualizar el estado de la prenda.');
        setToast({ 
          message: result.message || 'Error al actualizar el estado.', 
          type: 'error' 
        });
      }
    });
  };

  // Automatically hide toast notification after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error && !prenda) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center border-[3px] border-black bg-white select-none">
        <AlertCircle className="size-12 text-[#FF0000] mb-4" />
        <h3 className="text-lg font-heading uppercase text-black mb-2">Error de Carga</h3>
        <p className="font-sans text-sm text-gray-600 mb-6">{error}</p>
        {onClose && (
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-black text-white border-[3px] border-black font-mono font-bold uppercase tracking-[1px] hover:bg-white hover:text-black transition-all"
          >
            Cerrar Detalle
          </button>
        )}
      </div>
    );
  }

  if (!prenda) return null;

  // Proxy the S3 image URLs for local next/image compatibility
  const proxiedImages = prenda.imagenes.map((img: string) => {
    if (img && !img.startsWith('/') && !img.startsWith('data:')) {
      return `/api/proxy-image?url=${encodeURIComponent(img)}`;
    }
    return img;
  });

  // Determine state-based background accent color for transitions
  const stateAccentBg = prenda.estado === 'Sucio'
    ? 'bg-amber-500/5'
    : prenda.estado === 'Lavandería'
    ? 'bg-red-500/5'
    : 'bg-green-500/5';

  return (
    <div className={cn(
      "w-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 transition-all duration-500",
      pulseState ? "bg-black/10 scale-[0.99]" : "bg-white",
      !pulseState && stateAccentBg
    )}>
      
      {/* Custom Brutalist Toast notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[120] p-4 border-[3px] border-black font-mono font-bold uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[12px] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300",
          toast.type === 'success' ? 'bg-[#008000] text-white' : 'bg-[#FF0000] text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Column: Carousel */}
      <div className="w-full lg:w-1/2 shrink-0">
        <PrendaCarousel imagenes={proxiedImages} nombre={prenda.nombre} />
      </div>

      {/* Right Column: Information & Actions */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 select-none justify-between">
        <div className="flex flex-col gap-4">
          
          {/* Header Title */}
          <div className="flex flex-col gap-1 border-b-[3px] border-black pb-3">
            <h2 className="text-xl sm:text-2xl font-heading font-normal uppercase tracking-[0.5px] leading-tight text-black">
              {prenda.nombre}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] text-gray-500 uppercase">
                Registrado el: {new Date(prenda.createdAt || Date.now()).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>

          {/* Error alert inside modal */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-100 text-[#FF0000] border-[2px] border-[#FF0000] font-mono text-[11px] uppercase tracking-[0.5px]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Availability Switch */}
          <div className="flex flex-col gap-2 border-[3px] border-black p-4 bg-white">
            <label className="font-heading text-[12px] uppercase tracking-[1px] text-black flex items-center gap-1.5">
              Disponibilidad Operativa
              {isUpdating && <Loader2 className="size-3.5 animate-spin text-black" />}
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['Disponible', 'Sucio', 'Lavandería'] as const).map((estado) => {
                const isActive = prenda.estado === estado;
                let activeStyle = '';
                
                if (isActive) {
                  activeStyle = estado === 'Disponible' 
                    ? 'bg-[#008000] text-white' 
                    : estado === 'Sucio'
                    ? 'bg-[#FFA500] text-black'
                    : 'bg-[#FF0000] text-white';
                }

                return (
                  <button
                    key={estado}
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate(estado)}
                    className={cn(
                      "py-2 border-[2px] border-black text-[11px] font-mono font-bold uppercase tracking-[1px] transition-all",
                      isActive 
                        ? cn(activeStyle, "shadow-none translate-x-[1px] translate-y-[1px]")
                        : "bg-[#F0F0F0] text-black hover:bg-[#E8E8E8] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    )}
                  >
                    {estado}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Structured Metadata Badges */}
          <MetadataSection metadata={prenda.metadata} />

          {/* Delete Action Section */}
          <div className="mt-4 pt-4 border-t-[3px] border-black">
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="w-full py-3 bg-[#FF0000] text-white border-[3px] border-black font-mono font-bold uppercase tracking-[1.5px] text-[13px] hover:bg-black hover:text-[#FF0000] transition-all active:bg-black active:text-white flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Trash2 className="size-4" />
                Eliminar Prenda
              </button>
            ) : (
              <div className="border-[3px] border-black p-4 bg-white flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                <span className="font-heading text-[12px] uppercase tracking-[1px] text-black">
                  ¿Estás seguro de eliminar esta prenda permanentemente?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="py-2.5 border-[2px] border-black text-[11px] font-mono font-bold uppercase tracking-[1px] bg-white text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="py-2.5 border-[2px] border-black text-[11px] font-mono font-bold uppercase tracking-[1px] bg-[#FF0000] text-white hover:bg-black hover:text-[#FF0000] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <span>Confirmar</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {onClose && (
          <button 
            onClick={onClose}
            className="w-full py-3 bg-black text-white border-[3px] border-black font-mono font-bold uppercase tracking-[1.5px] text-[13px] hover:bg-white hover:text-black transition-all active:bg-black active:text-white"
          >
            Cerrar Detalle [ESC]
          </button>
        )}

      </div>
    </div>
  );
}

// Skeleton layout for Loading State
function DetailSkeleton() {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 bg-white animate-pulse">
      {/* Left skeleton */}
      <div className="w-full lg:w-1/2 aspect-[3/4] bg-gray-200 border-[3px] border-black" />
      {/* Right skeleton */}
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
