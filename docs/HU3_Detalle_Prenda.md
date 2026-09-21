# HU3: Vista de Detalle de Prenda

## 1. Identificador y Título
* **ID:** HU3
* **Título:** Detalle de Prenda

---

## 2. Historia de Usuario
**Como** usuario del Clóset Digital,  
**Quiero** abrir una vista expandida o modal al pulsar sobre cualquier prenda de la galería,  
**Para** ver sus imágenes en alta resolución, consultar su ficha de metadatos (talla, estilo, color) y cambiar su estado de disponibilidad de forma directa y rápida.

---

## 3. Criterios de Aceptación Funcionales
- [ ] **Presentación Adaptativa:** En pantallas móviles el detalle debe abrirse en un panel inferior deslizante (Drawer). En pantallas de escritorio se debe abrir en un cuadro de diálogo centrado (Dialog).
- [ ] **Carrusel de Imágenes Multi-táctil:** Si la prenda tiene múltiples fotos, el usuario debe poder deslizar (swipe) entre ellas con soporte táctil nativo en móvil y controles de flechas en desktop.
- [ ] **Desglose Estructurado de Metadata:** Todos los metadatos (categoría, subcategoría, talla, estaciones, estilo y colores) deben mostrarse visualmente organizados mediante Badges o Chips etiquetados.
- [ ] **Interruptor Rápido de Disponibilidad:** La vista detallada debe incluir un control interactivo (Select o Botón Toggle) para cambiar el estado de la prenda inmediatamente a `Disponible`, `Sucio` o `Lavandería`.
- [ ] **Persistencia y Actualización Reactiva:** Al actualizar el estado dentro del detalle, la base de datos debe reflejar el cambio, y la vista de la galería principal debe actualizarse en tiempo real de fondo (revalidación).

---

## 4. Especificación Técnica y Arquitectura

### A. Componentes UI (shadcn/ui y Custom)
Se utilizará la técnica híbrida de ventanas emergentes adaptativas para optimizar la UX de acuerdo con el dispositivo del usuario:

```typescript
// Estructura de Responsive Modal / Dialog en shadcn/ui
import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export function PrendaDetailModal({ open, onOpenChange, prendaId }: { open: boolean, onOpenChange: (open: boolean) => void, prendaId: string }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <PrendaDetailContent prendaId={prendaId} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <PrendaDetailContent prendaId={prendaId} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

#### Componentes de `shadcn/ui`
* **Dialog (`@/components/ui/dialog`):** Ventana modal estándar para pantallas medianas/grandes.
* **Drawer (`@/components/ui/drawer`):** Bottom-sheet interactivo (basado en `vaul`) optimizado para gestos de arrastre en móvil.
* **Carousel (`@/components/ui/carousel`):** Carrusel de imágenes implementado con `embla-carousel-react`, que añade física de arrastre táctil nativo.
* **Select (`@/components/ui/select`):** Para la manipulación del estado de la prenda.
* **Badge (`@/components/ui/badge`):** Visualización de etiquetas individuales de colores, estaciones y estilo.
* **Toast (`@/components/ui/use-toast`):** Notificación flotante de confirmación cuando el estado ha sido guardado exitosamente.

#### Componentes Custom
* **`PrendaCarousel` (`@/components/detalle/PrendaCarousel.tsx`):** Envuelve el carrusel de Embla, añade indicadores de puntos (dots) para la paginación de imágenes y soporte de pantalla completa al hacer clic en una foto.
* **`MetadataSection` (`@/components/detalle/MetadataSection.tsx`):** Agrupa y da formato a las secciones de la metadata de forma modular.

---

### B. Rutas API e Interacciones de Mutación

El cambio de estado se puede gatillar mediante una llamada API tipo PATCH o mediante una Server Action optimizada:

#### Endpoint de Actualización de Estado: `PATCH /api/prendas/[id]`
* **Método:** `PATCH`
* **URL:** `/api/prendas/603d4f8f4f1a23001f3bb91a`
* **Payload:**
  ```json
  {
    "estado": "Sucio"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "prenda": {
      "_id": "603d4f8f4f1a23001f3bb91a",
      "nombre": "Hoodie Oversized Negro",
      "estado": "Sucio",
      "updatedAt": "2026-06-13T19:26:00.000Z"
    }
  }
  ```
* **Respuesta Errónea (404 Not Found):**
  ```json
  {
    "error": "La prenda con el ID especificado no existe."
  }
  ```

#### Server Action: `updatePrendaEstadoAction`
```typescript
'use server';

import dbConnect from '@/lib/dbConnect';
import Prenda from '@/lib/models/Prenda';
import { revalidatePath } from 'next/cache';
import { EstadoPrenda } from '@/types/prenda';

export async function updatePrendaEstadoAction(prendaId: string, nuevoEstado: EstadoPrenda) {
  try {
    await dbConnect();

    // 1. Validar que el estado sea correcto
    const estadosValidos = ['Disponible', 'Sucio', 'Lavandería'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return { success: false, message: 'Estado de prenda inválido.' };
    }

    // 2. Buscar y actualizar
    const prendaActualizada = await Prenda.findByIdAndUpdate(
      prendaId,
      { estado: nuevoEstado },
      { new: true, runValidators: true }
    );

    if (!prendaActualizada) {
      return { success: false, message: 'La prenda no existe.' };
    }

    // 3. Invalidar la caché para refrescar vistas (galería y consola)
    revalidatePath('/');
    revalidatePath('/admin');

    return { 
      success: true, 
      prenda: JSON.parse(JSON.stringify(prendaActualizada)),
      message: 'Estado de disponibilidad actualizado.' 
    };

  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    return { success: false, message: 'Fallo al procesar la actualización en base de datos.' };
  }
}
```

---

## 5. Especificación UX/UI

### Diseño y Layout de la Ficha
* **Estructura Desktop (Dialog):** Dos columnas horizontales:
  * **Izquierda (50% de ancho):** Carrusel de fotos fijo con flechas visibles y paginador inferior en barra de progreso fina.
  * **Derecha (50% de ancho):** Cabecera con título e interruptor de disponibilidad destacado en la esquina. Debajo, rejilla de metadatos ordenados por bloques (Categoría, Talla, Estilo, Clima, Colores) y finalmente notas descriptivas del usuario.
* **Estructura Móvil (Drawer):** Distribución vertical fluida:
  * Carrusel superior ocupando el 100% del ancho del viewport de forma inmersiva.
  * Tirador visual superior del Drawer para permitir deslizar hacia abajo para cerrar.
  * Datos organizados verticalmente con scroll interno e interruptor pegajoso (sticky bottom bar) para permitir cambiar el estado rápidamente sin importar el scroll.

### Interacciones, Micro-animaciones y Estados de Carga
* **Apertura de Ventana:**
  * Dialog Desktop: `scale-95` a `scale-100` con `opacity-0` a `opacity-100` (duración 150ms).
  * Drawer Móvil: Desplazamiento de abajo hacia arriba (`translate-y-full` a `translate-y-0`) con física inercial (duración 300ms).
* **Cambio de Estado:** Al elegir un estado diferente, el control de selección muestra una animación de pulso y la tarjeta o el fondo del detalle atenúa su color temporalmente (`transition-colors duration-300`) para reflejar visualmente la transición (ej. si se marca "Sucio", el fondo del modal se torna sutilmente grisáceo/ámbar).
* **Placeholder de Carga:** Si la metadata tarda en resolverse, se usan líneas de esqueletos animadas (`animate-pulse`) simulando la estructura del texto y los badges de metadatos.

### Accesibilidad (a11y)
* **Control de Foco (Focus Trap):** Al abrir la vista, el foco queda atrapado dentro del Dialog/Drawer de forma estricta (gestionado nativamente por Radix UI).
* **Keyboard Navigation:**
  * Tecla `Escape` cierra la ventana en cualquier momento.
  * Teclas `Flecha Derecha` y `Flecha Izquierda` permiten navegar por el carrusel de imágenes.
  * Atributo `tabIndex={0}` para que el carrusel sea enfocable y comprensible.
* **Roles y Atributos:**
  * El botón de cierre posee `aria-label="Cerrar detalle"`.
  * La imagen activa del carrusel tiene un texto alternativo dinámico: `alt="Foto de la prenda: ${prenda.nombre} - Imagen ${index + 1} de ${total}"`.

---

## 6. Casos de Prueba y QA

### Escenario 1: Navegación Táctil e Interacción con el Carrusel (Happy Path)
* **Acción:** El usuario abre el detalle de una prenda con 3 fotos e interactúa mediante swipe hacia la izquierda.
* **Proceso:** El componente `Embla Carousel` responde fluidamente.
* **Resultado:** La imagen transiciona horizontalmente y los puntos indicadores (dots) inferiores se actualizan de la posición 1 a la 2 de forma síncrona.

### Escenario 2: Cambio Exitoso de Estado (Happy Path)
* **Acción:** El usuario cambia el selector de estado de "Disponible" a "Sucio" en una camisa.
* **Proceso:** Se ejecuta la Server Action `updatePrendaEstadoAction`. La base de datos actualiza el documento.
* **Resultado:** Se muestra un Toast en pantalla con el mensaje *"Prenda marcada como Sucio"*. Al cerrar el modal, la camisa en la galería principal se muestra con la opacidad reducida y el badge de "Sucio".

### Escenario 3: Intentar Actualizar una Prenda Eliminada de Fondo (Edge Case)
* **Acción:** El usuario mantiene abierto el detalle de una prenda que fue eliminada desde otra pestaña y cambia su estado.
* **Proceso:** La Server Action retorna `{ success: false, message: 'La prenda no existe.' }`.
* **Resultado:** El modal muestra una alerta superior con el error, el botón de guardado vuelve a su estado normal y no se realiza el cambio.
