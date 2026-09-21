# HU2: Galería de Guardarropa

## 1. Identificador y Título
* **ID:** HU2
* **Título:** Galería de Guardarropa

---

## 2. Historia de Usuario
**Como** usuario del Clóset Digital,  
**Quiero** ver todo mi guardarropa en una cuadrícula responsiva que pueda filtrar por categoría, color, estación o estado de lavado,  
**Para** explorar mis opciones visualmente y decidir ágilmente qué prendas usar según mi plan del día.

---

## 3. Criterios de Aceptación Funcionales
- [ ] **Cuadrícula Responsiva:** Distribución automática de tarjetas de prendas adaptadas al ancho de pantalla del dispositivo.
- [ ] **Filtros Avanzados Cruzados:** Posibilidad de filtrar de forma combinada por Categoría, Subcategoría, Colores, Clima/Estación, Estilo y Disponibilidad (Disponible, Sucio, Lavandería).
- [ ] **Buscador de Texto Libre:** Filtro por coincidencia en el nombre de la prenda o en las notas del usuario.
- [ ] **Tratamiento Visual de No Disponible:** Toda prenda en estado **Sucio** o **Lavandería** debe cambiar visualmente para denotar indisponibilidad (opacidad reducida, filtro de color e indicador textual).
- [ ] **Ordenamiento:** Selección de orden por fecha de registro (más reciente/antiguo) o por nombre (A-Z, Z-A).
- [ ] **Persistencia en URL (Deep Linking):** Todos los filtros y ordenamientos aplicados deben sincronizarse en la URL para permitir compartir o recargar la página manteniendo el mismo estado de búsqueda.

---

## 4. Especificación Técnica y Arquitectura

### A. Componentes UI (shadcn/ui y Custom)
#### Componentes de `shadcn/ui`
* **Dropdown Menu (`@/components/ui/dropdown-menu`):** Selector de opciones de ordenamiento.
* **Badge (`@/components/ui/badge`):** Etiquetas rápidas dentro de las tarjetas y tags de filtros activos.
* **Sheet / Drawer (`@/components/ui/sheet`):** Panel deslizable lateral (para desktop) o inferior (para móvil) que agrupa todos los filtros.
* **Card (`@/components/ui/card`):** Marco visual limpio para albergar la foto y nombre de la prenda.
* **Input (`@/components/ui/input`):** Barra de búsqueda de texto.
* **Skeleton (`@/components/ui/skeleton`):** Contenedores grises con pulsación suave para la carga perezosa de imágenes y carga de la cuadrícula.

#### Componentes Custom
* **`PrendaCard` (`@/components/galeria/PrendaCard.tsx`):** Tarjeta individual que muestra la imagen principal de la prenda (con `next/image` y placeholder de desenfoque), el nombre y las marcas de estado correspondientes.
* **`FilterPanel` (`@/components/galeria/FilterPanel.tsx`):** Controles estructurados de filtros (Checkboxes y Selectores) que actualizan los parámetros de la URL.
* **`EmptyState` (`@/components/galeria/EmptyState.tsx`):** Componente amigable que se muestra cuando no hay prendas que coincidan con la búsqueda actual, sugiriendo limpiar los filtros.

---

### B. Gestión de Estado: Sincronización con la URL (React 19 / Next.js 16)
La galería se controla mediante los **Search Params** de la URL. Esto permite delegar el estado al enrutador de Next.js, facilitando que el navegador use el historial de navegación hacia atrás y adelante de forma intuitiva.

* **Client Component (`"use client"`):** El componente de filtrado actualiza la URL utilizando `useSearchParams`, `usePathname` y `useRouter`.
* **Server Component (Next.js 16):** La página principal (`app/page.tsx`) lee asíncronamente los parámetros de búsqueda del servidor (`searchParams`), realiza el query a la base de datos de MongoDB y renderiza la cuadrícula de forma estática o dinámica.

#### Implementación del Servidor: `app/page.tsx`
```typescript
import dbConnect from '@/lib/dbConnect';
import Prenda from '@/lib/models/Prenda';
import { PrendaCard } from '@/components/galeria/PrendaCard';
import { FilterPanel } from '@/components/galeria/FilterPanel';
import { EmptyState } from '@/components/galeria/EmptyState';

interface PageProps {
  searchParams: Promise<{
    categoria?: string;
    subcategoria?: string;
    colores?: string;
    estaciones?: string;
    estado?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function GaleriaPage({ searchParams }: PageProps) {
  await dbConnect();
  
  // En Next.js 16, searchParams es una promesa y debe ser resuelta con await
  const params = await searchParams;

  const query: any = {};

  if (params.categoria) {
    query['metadata.categoria'] = params.categoria;
  }
  if (params.subcategoria) {
    query['metadata.subcategoria'] = params.subcategoria;
  }
  if (params.colores) {
    query['metadata.colores'] = { $in: params.colores.split(',') };
  }
  if (params.estaciones) {
    query['metadata.estaciones'] = { $in: params.estaciones.split(',') };
  }
  if (params.estado) {
    query.estado = params.estado;
  }
  if (params.search) {
    query.$or = [
      { nombre: { $regex: params.search, $options: 'i' } },
      { 'metadata.notas': { $regex: params.search, $options: 'i' } }
    ];
  }

  let sortOption: any = { createdAt: -1 }; // Por defecto más reciente
  if (params.sort === 'name-asc') sortOption = { nombre: 1 };
  if (params.sort === 'name-desc') sortOption = { nombre: -1 };
  if (params.sort === 'oldest') sortOption = { createdAt: 1 };

  const prendas = await Prenda.find(query).sort(sortOption).lean();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-64 shrink-0">
          <FilterPanel />
        </aside>
        
        <main className="flex-1">
          {prendas.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {prendas.map((prenda: any) => (
                <PrendaCard key={prenda._id.toString()} prenda={JSON.parse(JSON.stringify(prenda))} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

### C. Ruta de API Alternativa para Carga Dinámica (Infinite Scroll)
Si se requiere paginación reactiva, se provee el endpoint para llamadas AJAX:

#### `GET /api/prendas`
* **Método:** `GET`
* **Query Params:** `categoria`, `estado`, `colores`, `page` (default 1), `limit` (default 24).
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "_id": "603d4f...",
        "nombre": "Hoodie Oversized",
        "imagenes": ["https://res.cloudinary.com/..."],
        "estado": "Disponible",
        "metadata": { "categoria": "Superior", "talla": "L" }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 120
    }
  }
  ```

---

## 5. Especificación UX/UI

### Diseño y Composición Espacial
* **Grid Adaptativo:**
  * Móvil (ancho < 640px): **2 columnas**. Tamaño óptimo para interactuar en pantalla pequeña.
  * Tablet (ancho 640px a 1024px): **3 o 4 columnas**.
  * Desktop (ancho > 1024px): **5 o 6 columnas** para maximizar la visibilidad del catálogo en pantallas amplias sin forzar scroll excesivo.
* **Carga de Imágenes (Aspect Ratio):** Las imágenes deben usar una relación de aspecto consistente de **3:4** (estilo catálogo de moda) con propiedad `object-cover` para evitar deformaciones.

### Tratamiento Visual de Estados de No Disponibilidad
Cuando una prenda tiene un estado diferente de `Disponible`:
1. **Filtro CSS de Desaturación y Opacidad:** Se aplica a la imagen de la tarjeta la clase Tailwind: `opacity-60 grayscale-40 blur-[0.5px] transition-all`.
2. **Overlay de Estado:** Se superpone un texto centrado o un badge flotante semi-translúcido en color rojo o ámbar que indica de forma directa: `"SUCIO"` o `"LAVANDERÍA"`.
3. **Deshabilitación de Hover:** Se cancelan las micro-animaciones de elevación y el sombreado de la tarjeta para indicar inactividad operativa.

```typescript
// Lógica visual del indicador en PrendaCard
const isDisponible = prenda.estado === 'Disponible';
const badgeStyle = prenda.estado === 'Sucio' 
  ? 'bg-amber-500/95 text-white' 
  : 'bg-destructive/90 text-white';
```

### Micro-animaciones
* **Hover de Prenda Disponible:** Elevación del contenedor (`hover:-translate-y-1 hover:shadow-lg transition-all duration-300`).
* **Aparición de Imagen:** Uso de `next/image` con placeholder en baja resolución difuminada (`placeholder="blur"`). Al terminar la carga, transición suave de opacidad (`animate-fade-in`).

### Accesibilidad (a11y)
* **Atributos de Rol:** La cuadrícula posee un rol `role="grid"` y las tarjetas `role="gridcell"`.
* **Aria Labels:** Cada tarjeta de prenda contiene un aria-label enriquecido: `aria-label="Prenda: Camiseta Básica Blanca, Talla M, Estado: Sucio"`.
* **Teclado:** Se debe poder navegar entre las prendas usando las flechas de dirección o la tecla `Tab`. Al presionar `Enter` en una tarjeta activa, se debe abrir su detalle (HU3).

---

## 6. Casos de Prueba y QA

### Escenario 1: Filtrado Cruzado con Coincidencias (Happy Path)
* **Acción:** El usuario filtra por Categoría = "Superior", Color = "Negro" y Estado = "Disponible".
* **Proceso:** La URL se actualiza a `/?categoria=Superior&colores=Negro&estado=Disponible`. El servidor realiza el query con los campos indexados.
* **Resultado:** Se muestra únicamente el "Hoodie Oversized Negro" y la "Chamarra de Cuero Negra". Las imágenes cargan de forma progresiva.

### Escenario 2: Sin Coincidencias de Búsqueda (Edge Case)
* **Acción:** Se busca el término "Traje Espacial".
* **Proceso:** El query de MongoDB no encuentra registros.
* **Resultado:** Desaparece la cuadrícula de prendas y se monta el componente `EmptyState`. Este muestra una ilustración limpia de un perchero vacío, el texto *"No encontramos prendas con esos filtros"* y un botón accesible que limpia la URL (`/?`) para reiniciar la vista.
