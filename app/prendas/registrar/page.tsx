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
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/social/BottomNav';

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

// Compresión de imagen en cliente (HU1.1 / HU9) - Max 1024px, 80% calidad JPEG
function compressImageClient(fileOrBlob: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDim = 1024;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D del canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('La conversión a blob falló'));
            }
          },
          'image/jpeg',
          0.80
        );
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function RegistrarPrendaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [iaStatus, setIaStatus] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        notas: '',
        climaClo: null,
        impermeabilidad: null,
        capaPosicion: null,
        rolCapsula: null,
        ocasiones: [],
        texturaMaterial: ''
      }
    }
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;
  
  // Observar categoría seleccionada para actualizar subcategorías
  const selectedCategoria = watch('metadata.categoria');
  const subcategoriasDisponibles = relacionCategoriaSubcategoria[selectedCategoria] || [];

  const analyzeImageWithIA = async (fileOrBlob: File | Blob) => {
    setIsAnalyzing(true);
    setIaStatus('Comprimiendo imagen en cliente...');
    try {
      let compressedBlob: Blob;
      try {
        compressedBlob = await compressImageClient(fileOrBlob);
        setIaStatus('Imagen comprimida con éxito. Analizando prenda con IA...');
      } catch (err) {
        console.warn('Fallo la compresión en cliente, usando imagen original:', err);
        compressedBlob = fileOrBlob;
        setIaStatus('Analizando prenda con IA...');
      }

      const base64Image = await blobToBase64(compressedBlob);

      const res = await fetch('/api/prendas/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        throw new Error('La respuesta de la API de IA no fue exitosa.');
      }

      const iaData = await res.json();

      if (iaData.nombre) setValue('nombre', iaData.nombre, { shouldValidate: true });
      if (iaData.metadata) {
        const meta = iaData.metadata;
        if (meta.categoria) setValue('metadata.categoria', meta.categoria, { shouldValidate: true });
        if (meta.subcategoria) setValue('metadata.subcategoria', meta.subcategoria, { shouldValidate: true });
        if (meta.colores) setValue('metadata.colores', meta.colores, { shouldValidate: true });
        if (meta.estaciones) setValue('metadata.estaciones', meta.estaciones, { shouldValidate: true });
        if (meta.estilo) setValue('metadata.estilo', meta.estilo, { shouldValidate: true });
        if (meta.talla) setValue('metadata.talla', meta.talla, { shouldValidate: true });
        if (meta.notas) setValue('metadata.notas', meta.notas, { shouldValidate: true });
        
        if (meta.climaClo !== undefined) setValue('metadata.climaClo', meta.climaClo, { shouldValidate: true });
        if (meta.impermeabilidad) setValue('metadata.impermeabilidad', meta.impermeabilidad, { shouldValidate: true });
        if (meta.capaPosicion) setValue('metadata.capaPosicion', meta.capaPosicion, { shouldValidate: true });
        if (meta.rolCapsula) setValue('metadata.rolCapsula', meta.rolCapsula, { shouldValidate: true });
        if (meta.ocasiones) setValue('metadata.ocasiones', meta.ocasiones, { shouldValidate: true });
        if (meta.texturaMaterial) setValue('metadata.texturaMaterial', meta.texturaMaterial, { shouldValidate: true });
      }

      setIaStatus('✨ Formulario auto-completado con IA con éxito.');
    } catch (err: any) {
      console.error('Error al auto-completar con IA:', err);
      setIaStatus('❌ Falló el auto-completado con IA. Ingrese los datos manualmente.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setIaStatus(null), 5000);
    }
  };

  // Gestión de imágenes locales
  const handleAddImage = (file: File, previewUrl: string) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError(`El archivo "${file.name}" excede el tamaño máximo permitido (10MB).`);
      return;
    }
    setImages(prev => {
      const updated = [...prev, { file, previewUrl }];
      setValue('imagenes', updated.map(img => img.previewUrl), { shouldValidate: true });
      if (updated.length === 1) {
        analyzeImageWithIA(file);
      }
      return updated;
    });
    setUploadError(null);
  };

  const handleAddBlob = (blob: Blob, previewUrl: string) => {
    setImages(prev => {
      const updated = [...prev, { blob, previewUrl }];
      setValue('imagenes', updated.map(img => img.previewUrl), { shouldValidate: true });
      if (updated.length === 1) {
        analyzeImageWithIA(blob);
      }
      return updated;
    });
    setUploadError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      setValue('imagenes', updated.map(img => img.previewUrl), { shouldValidate: true });
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
        formData.append('categoria', data.metadata.categoria);
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
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-h-screen bg-[#F3F4F6] border-x-[5px] border-black pb-[64px]">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-[5px] border-black flex items-center justify-between px-4 h-[64px] w-full shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="h-10 w-10 text-black hover:text-gray-600 transition-colors p-0 border-none bg-transparent hover:bg-transparent"
            aria-label="Volver al clóset"
          >
            <ArrowLeft className="size-6 stroke-[2.5px]" />
          </Button>
          <span className="font-heading text-lg tracking-[1px] text-black select-none uppercase">
            Agregar Prenda
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white p-4 sm:p-6 select-none overflow-y-auto">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
          
          {/* Alertas de Éxito (Bordes gruesos de 3px, colores de estado puro) */}
          {successMessage && (
            <div className="border-[3px] border-[#008000] p-4 text-[#008000] bg-white font-mono text-sm uppercase">
              [ÉXITO]: {successMessage}
            </div>
          )}

          {/* Región en vivo para accesibilidad y mensajes visuales del estado de IA */}
          {iaStatus && (
            <div 
              role="status" 
              aria-live="polite"
              className="border-[3px] border-black bg-yellow-100 p-4 text-black font-mono text-sm uppercase tracking-[0.5px] animate-pulse"
            >
              [IA STATUS]: {iaStatus}
            </div>
          )}

          {/* Contenedor del Formulario (Tarjeta Brutalista: white fill, 5px black border) */}
          <form onSubmit={handleSubmit(onSubmit)} className="border-[5px] border-black bg-white p-6 sm:p-8 flex flex-col gap-6">
            
            {/* Foto Dropzone/Camera */}
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
              {errors.imagenes && (
                <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.imagenes.message}</p>
              )}
            </div>

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

            {/* Colores */}
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

            {/* Estaciones */}
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

            {/* Estilo */}
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

            {/* Sección de Metadatos Extendidos (Opcionales) */}
            <div className="border-t-[3px] border-black pt-6 flex flex-col gap-6">
              <span className="text-black font-heading text-base uppercase tracking-wider block">
                Metadatos Avanzados (Inferencia de IA)
              </span>

              {/* climaClo */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Aislamiento Térmico (climaClo)
                </label>
                <Controller
                  name="metadata.climaClo"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="0.01"
                      min="0.0"
                      max="2.0"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      placeholder="Ej: 0.45"
                      className={`bg-[#F0F0F0] text-black border-[3px] ${errors.metadata?.climaClo ? 'border-[#FF0000]' : 'border-black'} p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full`}
                    />
                  )}
                />
                {errors.metadata?.climaClo && (
                  <p className="text-[#FF0000] font-sans text-xs mt-1">{errors.metadata.climaClo.message}</p>
                )}
              </div>

              {/* impermeabilidad */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Nivel de Impermeabilidad
                </label>
                <Controller
                  name="metadata.impermeabilidad"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                      className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full cursor-pointer rounded-none"
                    >
                      <option value="">No clasificado</option>
                      <option value="Sin Proteccion">Sin Protección</option>
                      <option value="Repelente">Repelente</option>
                      <option value="Impermeable">Impermeable</option>
                    </select>
                  )}
                />
              </div>

              {/* capaPosicion */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Capa de Posicionamiento Térmico
                </label>
                <Controller
                  name="metadata.capaPosicion"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                      className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full cursor-pointer rounded-none"
                    >
                      <option value="">No clasificado</option>
                      <option value="Interior">Interior</option>
                      <option value="Media">Media</option>
                      <option value="Exterior">Exterior</option>
                      <option value="Única">Única</option>
                    </select>
                  )}
                />
              </div>

              {/* rolCapsula */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Rol en Armario Cápsula
                </label>
                <Controller
                  name="metadata.rolCapsula"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                      className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full cursor-pointer rounded-none"
                    >
                      <option value="">No clasificado</option>
                      <option value="Esencial Neutro">Esencial Neutro</option>
                      <option value="Pieza de Acento">Pieza de Acento</option>
                      <option value="Declaración">Declaración</option>
                    </select>
                  )}
                />
              </div>

              {/* ocasiones */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Ocasiones de Uso
                </label>
                <Controller
                  name="metadata.ocasiones"
                  control={control}
                  render={({ field }) => {
                    const selectedOcasiones = field.value || [];
                    const ocasionesDisponibles = ['Trabajo', 'Deporte', 'Social', 'Formal', 'Hogar', 'Playa'];
                    const toggleOcasion = (oc: string) => {
                      const isSelected = selectedOcasiones.includes(oc as any);
                      const updated = isSelected
                        ? selectedOcasiones.filter(o => o !== oc)
                        : [...selectedOcasiones, oc];
                      field.onChange(updated);
                    };

                    return (
                      <div className="flex flex-wrap gap-2">
                        {ocasionesDisponibles.map((oc) => {
                          const isSelected = selectedOcasiones.includes(oc as any);
                          return (
                            <button
                              key={oc}
                              type="button"
                              onClick={() => toggleOcasion(oc)}
                              className={`border-[2px] border-black px-3 py-1.5 font-mono uppercase text-[10px] tracking-[1px] cursor-pointer transition-colors ${isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F0F0F0]'}`}
                            >
                              {oc}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }}
                />
              </div>

              {/* texturaMaterial */}
              <div>
                <label className="text-black font-heading text-sm uppercase tracking-wider mb-2 block">
                  Textura y Material
                </label>
                <Controller
                  name="metadata.texturaMaterial"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Ej. Lana suave, denim grueso"
                      className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full"
                    />
                  )}
                />
              </div>
            </div>

            {/* Alertas de Error */}
            {(uploadError || Object.keys(errors).length > 0) && (
              <div className="border-[3px] border-[#FF0000] p-4 text-[#FF0000] bg-white font-mono text-sm uppercase">
                [ERROR]: {uploadError || 'Existen errores de validación en el formulario. Por favor, revíselos antes de guardar.'}
              </div>
            )}

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
        </div>
      </main>

      {/* Modal de Cámara */}
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

      {/* Navigation */}
      <BottomNav />
    </div>
  );
}

