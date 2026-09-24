'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface UploadedImage {
  file?: File;
  blob?: Blob;
  previewUrl: string;
}

interface MultiImageUploadProps {
  images: UploadedImage[];
  onAddImage: (file: File, previewUrl: string) => void;
  onAddBlob: (blob: Blob, previewUrl: string) => void;
  onRemoveImage: (index: number) => void;
  onOpenCamera: () => void;
}

export function MultiImageUpload({
  images,
  onAddImage,
  onRemoveImage,
  onOpenCamera,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        if (images.length >= 4) return;
        const previewUrl = URL.createObjectURL(file);
        onAddImage(file, previewUrl);
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4 w-full" role="region" aria-label="Previsualización de fotos de la prenda">
      <div className="grid grid-cols-2 gap-4">
        {images.map((img, index) => (
          <div 
            key={index}
            className="relative aspect-square border-[3px] border-black bg-white group select-none animate-in zoom-in-95 duration-200"
          >
            {/* Image Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={img.previewUrl} 
              alt={`Vista previa ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Delete button (Brutalist style) */}
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-0 right-0 bg-black text-white hover:bg-[#FF0000] font-mono px-2 py-1 text-xs cursor-pointer border-l-[3px] border-b-[3px] border-black uppercase font-bold transition-colors"
              title="Eliminar imagen"
              aria-label={`Eliminar imagen ${index + 1}`}
            >
              [X]
            </button>
          </div>
        ))}

        {images.length < 4 && (
          <div className="aspect-square border-[3px] border-dashed border-black bg-[#F0F0F0] flex flex-col items-center justify-center p-4 text-center">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              multiple
            />
            
            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={triggerFileInput}
                className="bg-white text-black border-[3px] border-black py-2 px-3 text-xs font-heading font-bold uppercase tracking-[1px] hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                Cargar Archivo
              </button>
              
              <button
                type="button"
                onClick={onOpenCamera}
                className="bg-black text-white border-[3px] border-black py-2 px-3 text-xs font-heading font-bold uppercase tracking-[1px] hover:bg-white hover:text-black transition-colors cursor-pointer"
                aria-haspopup="dialog"
              >
                Usar Cámara
              </button>
            </div>
            <span className="text-[10px] font-mono mt-3 text-gray-500">
              MÁXIMO 4 FOTOS (MÁX 10MB CADA UNA) ({images.length}/4)
            </span>
          </div>
        )}
      </div>

      {images.length >= 4 && (
        <div className="border-[3px] border-black bg-white p-3 text-center text-xs font-mono">
          LÍMITE MÁXIMO DE 4 FOTOGRAFÍAS ALCANZADO.
        </div>
      )}
    </div>
  );
}
