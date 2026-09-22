'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer';
import { PrendaDetailContent } from './PrendaDetailContent';
import { EstadoPrenda } from '@/types/prenda';

interface PrendaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prendaId: string;
  onStatusChange?: (newStatus: EstadoPrenda) => void;
}

export function PrendaDetailModal({ 
  open, 
  onOpenChange, 
  prendaId, 
  onStatusChange 
}: PrendaDetailModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleClose = () => {
    onOpenChange(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] p-0 bg-white border-[5px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalle de Prenda</DialogTitle>
            <DialogDescription>
              Ficha técnica y control de disponibilidad de la prenda seleccionada.
            </DialogDescription>
          </DialogHeader>
          <PrendaDetailContent 
            prendaId={prendaId} 
            onStatusChange={onStatusChange} 
            onClose={handleClose} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white border-t-[5px] border-black rounded-none p-0 overflow-y-auto max-h-[92vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Detalle de Prenda</DrawerTitle>
          <DrawerDescription>
            Ficha técnica y control de disponibilidad de la prenda seleccionada.
          </DrawerDescription>
        </DrawerHeader>
        {/* Mobile handle indicator */}
        <div className="mx-auto my-3 h-1.5 w-[60px] bg-black border border-black" />
        <div className="pb-8">
          <PrendaDetailContent 
            prendaId={prendaId} 
            onStatusChange={onStatusChange} 
            onClose={handleClose} 
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
