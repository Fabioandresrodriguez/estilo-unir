'use client';

import React, { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { 
  PrendaZodSchema, 
  PrendaInput, 
  relacionCategoriaSubcategoria 
} from '@/lib/validations/prenda';
import { createPrendaAction } from '@/app/actions/prenda-actions';
import { Button } from '@/components/ui/button';
import { MultiImageUpload } from '@/components/prendas/MultiImageUpload';
import { CameraCapture } from '@/components/prendas/CameraCapture';

// Mapeo de colores para la representación visual (HU0 y guía de diseño)
const colorHexMap: Record<string, string> = {
  'Negro': '#000000',
  'Blanco': '#FFFFFF',
  'Gris': '#808080',
  'Azul Marino': '#000080',
  'Azul Claro': '#ADD8E6',
  'Beige': '#F5F5DC',
  'Café': '#8B4513',
  'Verde Oliva': '#556B2F',
  'Burdeos': '#800020',
  'Rojo': '#FF0000',
  'Amarillo': '#FFFF00',
  'Verde': '#008000',
  'Rosa': '#FFC0CB',
};

const estacionesDisponibles = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año'];
const estilosDisponibles = ['Casual', 'Formal', 'Deportivo', 'Streetwear', 'Oficina', 'Fiesta'];

interface UploadedImage {
  file?: File;
  blob?: Blob;
  previewUrl: string;
}

export default function RegistrarPrendaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<PrendaInput>({
    resolver: zodResolver(PrendaZodSchema),
    defaultValues: {
      nombre: '',
      imagenes: [],
      estado: 'Disponible',
      metadata: {
        categoria: 'Superior',
        subcategoria: '',
        colores: [],
        estaciones: [],
        estilo: [],
        talla: '',
        notas: ''
      }
    }
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;
  
  // Observar categoría seleccionada para actualizar subcategorías
  const selectedCategoria = watch('metadata.categoria');
  const subcategoriasDisponibles = relacionCategoriaSubcategoria[selectedCategoria] || [];

  // Gestión de imágenes locales
  const handleAddImage = (file: File, previewUrl: string) => {
    setImages(prev => [...prev, { file, previewUrl }]);
    setUploadError(null);
  };

  const handleAddBlob = (blob: Blob, previewUrl: string) => {
    setImages(prev => [...prev, { blob, previewUrl }]);
    setUploadError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      // Revocar URL temporal para evitar fugas de memoria
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Subida de imágenes a la API e inserción en base de datos
  const onSubmit = async (data: PrendaInput) => {
    setUploadError(null);
    setSuccessMessage(null);

    if (images.length === 0) {
      setUploadError('Debe agregar al menos una imagen de la prenda.');
      return;
    }

    startTransition(async () => {
      try {
        // 1. Subida de archivos mediante API REST
        const formData = new FormData();
        images.forEach((img) => {
          if (img.file) {
            formData.append('files', img.file);
          } else if (img.blob) {
            formData.append('files', img.blob, 'camera-capture.jpg');
          }
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Fallo al subir las imágenes.');
        }

        const { urls } = await uploadRes.json();

        // 2. Ejecución de la Server Action
        const payload = {
          ...data,
          imagenes: urls
        };

        const result = await createPrendaAction(null, payload);

        if (result.success) {
          setSuccessMessage(result.message);
          // Redirigir a galería tras breve retardo para mostrar éxito
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1500);
        } else {
          // Si el servidor retorna errores de validación
          if (result.errors) {
            const errorText = Object.entries(result.errors)
              .map(([key, val]) => `${key}: ${(val as string[]).join(', ')}`)
              .join(' | ');
            setUploadError(`${result.message} Details: ${errorText}`);
          } else {
            setUploadError(result.message);
          }
        }
      } catch (err: any) {
        console.error('Error al registrar prenda:', err);
        setUploadError(err.message || 'Ocurrió un error inesperado al subir los datos.');
      }
    });
  };

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 select-none">
      {/* Botón Volver (Estilo Ghost Brutalista: transparent, black text, no border, underline, hover: text blue) */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/')}
          className="pl-0"
        >
          &lt; Volver al clóset
        </Button>
      </div>

      {/* Título de la Página (Estilo Brutalista: Archivo Black, 48px, mayúsculas) */}
      <h2 className="text-3xl sm:text-[48px] font-heading font-normal uppercase leading-none mb-8">
        Registrar Prenda
      </h2>

      {/* Alertas de Éxito o Error (Bordes gruesos de 3px, colores de estado puro) */}
      {uploadError && (
        <div className="border-[3px] border-[#FF0000] p-4 text-[#FF0000] bg-white font-mono text-sm mb-6 uppercase">
          [ERROR]: {uploadError}
        </div>
      )}

      {successMessage && (
        <div className="border-[3px] border-[#008000] p-4 text-[#008000] bg-white font-mono text-sm mb-6 uppercase">
          [ÉXITO]: {successMessage}
        </div>
      )}

      {/* Contenedor del Formulario (Tarjeta Brutalista: white fill, 5px black border) */}
      <form onSubmit={handleSubmit(onSubmit)} className="border-[5px] border-black bg-white p-6 sm:p-8 flex flex-col gap-8">
        
        {/* Layout de dos paneles (1 col en móvil, 2 cols en desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Panel Izquierdo: Multi-Foto Dropzone/Camera */}
          <div className="flex flex-col gap-4">
            <span className="text-black font-heading text-sm uppercase tracking-wider block">
              FOTOGRAFÍAS DE LA PRENDA *
            </span>
            <MultiImageUpload 
              images={images}
              onAddImage={handleAddImage}
              onAddBlob={handleAddBlob}
              onRemoveImage={handleRemoveImage}
              onOpenCamera={() => setIsCameraOpen(true)}
            />
          </div>

          {/* Panel Derecho: Inputs y Metadata */}
          <div className="flex flex-col gap-6">
            
            {/* Nombre */}
            <div>
              <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                Nombre de la Prenda *
              </label>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Ej. Hoodie Negro Heavyweight"
                    className={`bg-[#F0F0F0] text-black border-[3px] ${errors.nombre ? 'border-[#FF0000]' : 'border-black'} p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full`}
                  />
                )}
              />
              {errors.nombre && (
                <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.nombre.message}</p>
              )}
            </div>

            {/* Fila: Categoría y Subcategoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Categoría */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Categoría *
                </label>
                <Controller
                  name="metadata.categoria"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Resetear subcategoría al cambiar de categoría
                        setValue('metadata.subcategoria', '');
                      }}
                      className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full cursor-pointer rounded-none"
                    >
                      <option value="Superior">Superior</option>
                      <option value="Inferior">Inferior</option>
                      <option value="Entero">Entero</option>
                      <option value="Calzado">Calzado</option>
                      <option value="Accesorios">Accesorios</option>
                    </select>
                  )}
                />
              </div>

              {/* Subcategoría */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Subcategoría *
                </label>
                <Controller
                  name="metadata.subcategoria"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={subcategoriasDisponibles.length === 0}
                      className={`bg-[#F0F0F0] text-black border-[3px] ${errors.metadata?.subcategoria ? 'border-[#FF0000]' : 'border-black'} p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-none`}
                    >
                      <option value="">Seleccione...</option>
                      {subcategoriasDisponibles.map((subcat) => (
                        <option key={subcat} value={subcat}>{subcat}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.metadata?.subcategoria && (
                  <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.metadata.subcategoria.message}</p>
                )}
              </div>

            </div>

            {/* Talla */}
            <div>
              <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                Talla *
              </label>
              <Controller
                name="metadata.talla"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Ej. L, 32, 42, M"
                    className={`bg-[#F0F0F0] text-black border-[3px] ${errors.metadata?.talla ? 'border-[#FF0000]' : 'border-black'} p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full`}
                  />
                )}
              />
              {errors.metadata?.talla && (
                <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.metadata.talla.message}</p>
              )}
            </div>

            {/* Colores (Representación Visual con Círculos Reales de Color + Estado Activo Brutalista) */}
            <div>
              <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                Colores * (Selecciona uno o más)
              </label>
              <Controller
                name="metadata.colores"
                control={control}
                render={({ field }) => {
                  const selectedColors = field.value || [];
                  const toggleColor = (color: string) => {
                    const isSelected = selectedColors.includes(color as any);
                    const updated = isSelected 
                      ? selectedColors.filter(c => c !== color)
                      : [...selectedColors, color];
                    field.onChange(updated);
                  };

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.keys(colorHexMap).map((color) => {
                        const hex = colorHexMap[color];
                        const isSelected = selectedColors.includes(color as any);
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => toggleColor(color)}
                            className={`border-[2px] border-black p-2 font-mono uppercase text-[10px] tracking-[1px] cursor-pointer select-none flex items-center gap-2 transition-colors ${isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F0F0F0]'}`}
                          >
                            <span 
                              className="w-4 h-4 border border-black inline-block shrink-0" 
                              style={{ backgroundColor: hex }}
                              aria-label={`Color ${color}`}
                            />
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {errors.metadata?.colores && (
                <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.metadata.colores.message}</p>
              )}
            </div>

            {/* Estaciones (Chips de Filtro Activos) */}
            <div>
              <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                Estación/Clima *
              </label>
              <Controller
                name="metadata.estaciones"
                control={control}
                render={({ field }) => {
                  const selectedEstaciones = field.value || [];
                  const toggleEstacion = (est: string) => {
                    const isSelected = selectedEstaciones.includes(est as any);
                    const updated = isSelected
                      ? selectedEstaciones.filter(e => e !== est)
                      : [...selectedEstaciones, est];
                    field.onChange(updated);
                  };

                  return (
                    <div className="flex flex-wrap gap-2">
                      {estacionesDisponibles.map((est) => {
                        const isSelected = selectedEstaciones.includes(est as any);
                        return (
                          <button
                            key={est}
                            type="button"
                            onClick={() => toggleEstacion(est)}
                            className={`border-[2px] border-black px-3 py-1.5 font-mono uppercase text-[10px] tracking-[1px] cursor-pointer transition-colors ${isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F0F0F0]'}`}
                          >
                            {est}
                          </button>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {errors.metadata?.estaciones && (
                <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.metadata.estaciones.message}</p>
              )}
            </div>

            {/* Estilo (Chips de Filtro Activos) */}
            <div>
              <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                Estilo / Ocasión *
              </label>
              <Controller
                name="metadata.estilo"
                control={control}
                render={({ field }) => {
                  const selectedEstilos = field.value || [];
                  const toggleEstilo = (est: string) => {
                    const isSelected = selectedEstilos.includes(est as any);
                    const updated = isSelected
                      ? selectedEstilos.filter(e => e !== est)
                      : [...selectedEstilos, est];
                    field.onChange(updated);
                  };

                  return (
                    <div className="flex flex-wrap gap-2">
                      {estilosDisponibles.map((est) => {
                        const isSelected = selectedEstilos.includes(est as any);
                        return (
                          <button
                            key={est}
                            type="button"
                            onClick={() => toggleEstilo(est)}
                            className={`border-[2px] border-black px-3 py-1.5 font-mono uppercase text-[10px] tracking-[1px] cursor-pointer transition-colors ${isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F0F0F0]'}`}
                          >
                            {est}
                          </button>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {errors.metadata?.estilo && (
                <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.metadata.estilo.message}</p>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                Notas / Detalles adicionales
              </label>
              <Controller
                name="metadata.notas"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Ej. Algodón pesado de 400 GSM, lavar con agua fría."
                    className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full min-h-[100px] rounded-none resize-y"
                  />
                )}
              />
            </div>

          </div>
        </div>

        {/* Acciones del Formulario */}
        <div className="border-t-[3px] border-black pt-6 flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/')}
            className="w-full sm:w-auto"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            className="w-full sm:w-auto"
            disabled={isPending}
          >
            {isPending ? 'Guardando...' : 'Guardar Prenda'}
          </Button>
        </div>

      </form>

      {/* Modal de Cámara (Streaming y Captura en Tiempo Real) */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white border-[5px] border-black p-6 w-full max-w-lg relative animate-in zoom-in-95 duration-200">
            <button 
              type="button" 
              onClick={() => setIsCameraOpen(false)}
              className="absolute top-3 right-3 font-mono text-xs uppercase underline tracking-[1px] hover:text-[#0000FF] cursor-pointer font-bold"
            >
              Cerrar [X]
            </button>
            <h3 className="text-xl font-heading mb-4 uppercase">Capturar Prenda</h3>
            <CameraCapture 
              onCapture={(blob, previewUrl) => {
                handleAddBlob(blob, previewUrl);
                setIsCameraOpen(false);
              }}
              onClose={() => setIsCameraOpen(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
