'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  relacionCategoriaSubcategoria 
} from '@/lib/validations/prenda';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const coloresValidos = [
  'Negro', 'Blanco', 'Gris', 'Azul Marino', 'Azul Claro', 
  'Beige', 'Café', 'Verde Oliva', 'Burdeos', 'Rojo', 
  'Amarillo', 'Verde', 'Rosa'
] as const;

const estacionesValidas = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año'] as const;
const estilosValidos = ['Casual', 'Formal', 'Deportivo', 'Streetwear', 'Oficina', 'Fiesta'] as const;
const estadosValidos = ['Disponible', 'Sucio', 'Lavandería'] as const;

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

export function FilterPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for search text to debounce updates
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');

  // Sync local search input with URL search params changes (like reset)
  useEffect(() => {
    setSearchText(searchParams.get('search') || '');
  }, [searchParams]);

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText !== (searchParams.get('search') || '')) {
        updateParams({ search: searchText });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  // Helper to update individual parameters in the URL
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 when filters change
    params.delete('page');

    for (const [key, value] of Object.entries(newParams)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Get current active state filters
  const selectedCategoria = searchParams.get('categoria') || '';
  const selectedSubcategoria = searchParams.get('subcategoria') || '';
  const selectedColores = searchParams.get('colores') ? searchParams.get('colores')!.split(',') : [];
  const selectedEstaciones = searchParams.get('estaciones') ? searchParams.get('estaciones')!.split(',') : [];
  const selectedEstilos = searchParams.get('estilos') ? searchParams.get('estilos')!.split(',') : [];
  const selectedEstado = searchParams.get('estado') || '';
  const selectedSort = searchParams.get('sort') || 'newest';

  // Toggle handlers for multi-select options
  const handleToggleColor = (color: string) => {
    let nextColores = [...selectedColores];
    if (nextColores.includes(color)) {
      nextColores = nextColores.filter(c => c !== color);
    } else {
      nextColores.push(color);
    }
    updateParams({ colores: nextColores.length > 0 ? nextColores.join(',') : null });
  };

  const handleToggleEstacion = (estacion: string) => {
    let nextEstaciones = [...selectedEstaciones];
    if (nextEstaciones.includes(estacion)) {
      nextEstaciones = nextEstaciones.filter(e => e !== estacion);
    } else {
      nextEstaciones.push(estacion);
    }
    updateParams({ estaciones: nextEstaciones.length > 0 ? nextEstaciones.join(',') : null });
  };

  const handleToggleEstilo = (estilo: string) => {
    let nextEstilos = [...selectedEstilos];
    if (nextEstilos.includes(estilo)) {
      nextEstilos = nextEstilos.filter(e => e !== estilo);
    } else {
      nextEstilos.push(estilo);
    }
    updateParams({ estilos: nextEstilos.length > 0 ? nextEstilos.join(',') : null });
  };

  const handleToggleCategoria = (categoria: string) => {
    if (selectedCategoria === categoria) {
      // Toggle off, clear subcategory too
      updateParams({ categoria: null, subcategoria: null });
    } else {
      // Toggle on, clear previous subcategory since it might not be compatible
      updateParams({ categoria, subcategoria: null });
    }
  };

  const handleToggleSubcategoria = (subcat: string) => {
    if (selectedSubcategoria === subcat) {
      updateParams({ subcategoria: null });
    } else {
      updateParams({ subcategoria: subcat });
    }
  };

  const handleToggleEstado = (estado: string) => {
    if (selectedEstado === estado) {
      updateParams({ estado: null });
    } else {
      updateParams({ estado: estado });
    }
  };

  const handleClearAll = () => {
    setSearchText('');
    router.push(pathname);
  };

  // Check if any filter is active
  const hasActiveFilters = 
    selectedCategoria || 
    selectedSubcategoria || 
    selectedColores.length > 0 || 
    selectedEstaciones.length > 0 || 
    selectedEstilos.length > 0 || 
    selectedEstado || 
    searchText;

  return (
    <div className="flex flex-col gap-6 border-[3px] border-black bg-white p-5 select-none font-sans">
      
      {/* Title & Reset Button */}
      <div className="flex items-center justify-between border-b-[3px] border-black pb-3">
        <h2 className="text-xl font-heading font-normal uppercase tracking-[1px] m-0 text-black">
          Filtros
        </h2>
        {hasActiveFilters && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-[1.5px] border-[2px] border-black bg-[#FF0000] text-white hover:bg-black hover:text-[#FF0000] px-2 py-1 transition-all"
          >
            Limpiar <X className="size-3" />
          </button>
        )}
      </div>

      {/* Free Text Search */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Buscador
        </label>
        <Input 
          type="text" 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Ej: Hoodie, notas..."
          className="w-full"
        />
      </div>

      {/* Sorting Selector */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Ordenar Por
        </label>
        <select
          value={selectedSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="h-[44px] w-full px-[12px] py-[10px] text-[15px] font-mono text-black border-[3px] border-black bg-[#F0F0F0] hover:bg-[#E8E8E8] focus:border-[5px] focus:outline-none transition-all cursor-pointer"
        >
          <option value="newest">Más reciente primero</option>
          <option value="oldest">Más antiguo primero</option>
          <option value="name-asc">Nombre (A-Z)</option>
          <option value="name-desc">Nombre (Z-A)</option>
        </select>
      </div>

      {/* Categories Section */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Categoría
        </label>
        <div className="flex flex-wrap gap-2">
          {['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios'].map((cat) => {
            const isActive = selectedCategoria === cat;
            return (
              <Badge
                key={cat}
                variant={isActive ? 'filterActive' : 'filter'}
                onClick={() => handleToggleCategoria(cat)}
              >
                {cat}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Subcategories (only shown if a category is selected) */}
      {selectedCategoria && (
        <div className="flex flex-col gap-2 border-t-[2px] border-dashed border-black pt-3">
          <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
            Subcategoría de {selectedCategoria}
          </label>
          <div className="flex flex-wrap gap-2">
            {(relacionCategoriaSubcategoria[selectedCategoria] || []).map((subcat) => {
              const isActive = selectedSubcategoria === subcat;
              return (
                <Badge
                  key={subcat}
                  variant={isActive ? 'filterActive' : 'filter'}
                  onClick={() => handleToggleSubcategoria(subcat)}
                >
                  {subcat}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Availability / Availability Status */}
      <div className="flex flex-col gap-2 border-t-[3px] border-black pt-4">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Disponibilidad
        </label>
        <div className="flex flex-wrap gap-2">
          {estadosValidos.map((estado) => {
            const isActive = selectedEstado === estado;
            return (
              <Badge
                key={estado}
                variant={isActive ? 'filterActive' : 'filter'}
                onClick={() => handleToggleEstado(estado)}
              >
                {estado}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Colors List */}
      <div className="flex flex-col gap-2 border-t-[3px] border-black pt-4">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Colores
        </label>
        <div className="grid grid-cols-2 gap-2">
          {coloresValidos.map((color) => {
            const isChecked = selectedColores.includes(color);
            const hexColor = colorHexMap[color] || '#FFFFFF';
            const isWhite = color === 'Blanco' || color === 'Beige' || color === 'Amarillo' || color === 'Rosa' || color === 'Azul Claro';
            
            return (
              <button
                key={color}
                onClick={() => handleToggleColor(color)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 border-[2px] border-black text-[12px] font-mono font-bold uppercase transition-all text-left",
                  isChecked 
                    ? "bg-black text-white" 
                    : "bg-[#F0F0F0] text-black hover:bg-[#E8E8E8]"
                )}
              >
                {/* Visual circle swatch with border */}
                <span 
                  className={cn(
                    "size-3 shrink-0 border border-black",
                    isChecked && (isWhite ? "border-white" : "border-black")
                  )} 
                  style={{ backgroundColor: hexColor }}
                />
                <span className="truncate">{color}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seasons Checkboxes */}
      <div className="flex flex-col gap-2 border-t-[3px] border-black pt-4">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Estación / Clima
        </label>
        <div className="flex flex-col gap-1.5">
          {estacionesValidas.map((estacion) => {
            const isChecked = selectedEstaciones.includes(estacion);
            return (
              <label 
                key={estacion} 
                className="flex items-center gap-3 cursor-pointer text-[13px] font-mono uppercase tracking-[0.5px] py-1 select-none"
              >
                <input 
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleEstacion(estacion)}
                  className="appearance-none size-5 border-[3px] border-black bg-white checked:bg-black cursor-pointer transition-all outline-none focus:border-[5px]"
                />
                <span>{estacion}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Styles Checkboxes */}
      <div className="flex flex-col gap-2 border-t-[3px] border-black pt-4">
        <label className="font-heading text-[12px] uppercase tracking-[1px] text-black">
          Estilo
        </label>
        <div className="flex flex-col gap-1.5">
          {estilosValidos.map((estilo) => {
            const isChecked = selectedEstilos.includes(estilo);
            return (
              <label 
                key={estilo} 
                className="flex items-center gap-3 cursor-pointer text-[13px] font-mono uppercase tracking-[0.5px] py-1 select-none"
              >
                <input 
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleEstilo(estilo)}
                  className="appearance-none size-5 border-[3px] border-black bg-white checked:bg-black cursor-pointer transition-all outline-none focus:border-[5px]"
                />
                <span>{estilo}</span>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
}
