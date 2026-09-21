# HU4: Consola de Administración de Disponibilidad

## 1. Identificador y Título
* **ID:** HU4
* **Título:** Consola de Administración de Disponibilidad

---

## 2. Historia de Usuario
**Como** usuario del Clóset Digital,  
**Quiero** disponer de una consola centralizada de administración dividida en dos pestañas ("Prendas Disponibles" y "Fuera de Circulación"),  
**Para** marcar rápidamente qué prendas he usado hoy (enviándolas al canasto de ropa sucia) y gestionar el lavado de ropa sucia (marcando prendas de forma individual o masiva como limpias) con un solo clic.

---

## 3. Criterios de Aceptación Funcionales
- [ ] **Estructura en Dos Secciones:** Una pestaña con las prendas en estado `Disponible` (ropa activa) y otra pestaña que agrupe las prendas en estado `Sucio` o `Lavandería` (fuera de circulación).
- [ ] **Selección Múltiple (Bulk Action):** Incorporar checkboxes por cada prenda para poder seleccionar de 1 a N prendas y realizar un cambio de estado masivo (ej. "Mandar a Lavandería" o "Marcar como Disponible").
- [ ] **Acción Rápida Individual:** Botón directo en la fila de la prenda que cambie su estado de un clic sin necesidad de abrir su detalle completo.
- [ ] **Transición de Estados Inmediata (Optimistic UI):** La prenda debe desaparecer de la pestaña actual y aparecer en la pestaña correspondiente de forma fluida y sin bloqueos de interfaz de usuario.
- [ ] **Sincronización en Base de Datos:** Los cambios deben persistir de inmediato en la base de datos de MongoDB.

---

## 4. Especificación Técnica y Arquitectura

### A. Componentes UI (shadcn/ui y Custom)
#### Componentes de `shadcn/ui`
* **Tabs (`@/components/ui/tabs`):** Estructura base para separar "Disponibles" y "Fuera de Circulación" (ropa sucia).
* **Table (`@/components/ui/table`):** Visualización de la lista de prendas en pantallas medianas y grandes, incluyendo miniatura de imagen, nombre, categoría y estado.
* **Checkbox (`@/components/ui/checkbox`):** Selección múltiple de elementos en la tabla.
* **Button (`@/components/ui/button`):** Disparadores de acciones masivas e individuales (ej. "Marcar seleccionados como Limpios").
* **Toast (`@/components/ui/use-toast`):** Notificación emergente sobre el resultado de la acción grupal o individual.

#### Componentes Custom
* **`ConsoleRow` (`@/components/consola/ConsoleRow.tsx`):** Fila de la tabla para cada prenda que encapsula su checkbox, miniatura e interactividad individual.
* **`BulkActionBanner` (`@/components/consola/BulkActionBanner.tsx`):** Barra inferior flotante que aparece de forma automática al seleccionar al menos una prenda, ofreciendo los botones de acción masiva correspondientes.

---

### B. Gestión de Estado: Actualizaciones Optimistas con React 19 (`useOptimistic`)

Para proporcionar una experiencia instantánea y sin fricción de carga, la consola implementa el hook nativo de React 19 `useOptimistic`. Al cambiar el estado de una prenda, la UI asume el éxito de la operación, reacomoda las listas de inmediato y de forma paralela despacha la Server Action de fondo. Si la llamada del servidor falla, el estado regresa automáticamente a su valor inicial.

#### Implementación del Enfoque React 19 `useOptimistic`:
```typescript
'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { bulkUpdatePrendaEstadoAction } from '@/lib/actions/prendaActions';
import { IPrenda, EstadoPrenda } from '@/types/prenda';
import { ConsoleRow } from './ConsoleRow';
import { BulkActionBanner } from './BulkActionBanner';
import { useToast } from '@/components/ui/use-toast';

export function ConsolaAdministracion({ prendasIniciales }: { prendasIniciales: IPrenda[] }) {
  const [prendas, setPrendas] = useState<IPrenda[]>(prendasIniciales);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // useOptimistic para la lista de prendas
  const [optimisticPrendas, setOptimisticPrendas] = useOptimistic(
    prendas,
    (state, update: { ids: string[]; nuevoEstado: EstadoPrenda }) =>
      state.map((prenda) =>
        prenda._id && update.ids.includes(prenda._id)
          ? { ...prenda, estado: update.nuevoEstado }
          : prenda
      )
  );

  const handleBulkStatusChange = async (ids: string[], nuevoEstado: EstadoPrenda) => {
    setSelectedIds([]); // Limpiar selección
    
    startTransition(async () => {
      // 1. Aplicar cambio optimista en UI (de inmediato)
      setOptimisticPrendas({ ids, nuevoEstado });

      // 2. Ejecutar la mutación real en el servidor
      const result = await bulkUpdatePrendaEstadoAction(ids, nuevoEstado);

      if (result.success) {
        // 3. Confirmar cambio real en el estado base
        setPrendas((prev) =>
          prev.map((prenda) =>
            prenda._id && ids.includes(prenda._id) ? { ...prenda, estado: nuevoEstado } : prenda
          )
        );
        toast({
          title: "Estado actualizado",
          description: `Se actualizaron ${ids.length} prendas con éxito.`
        });
      } else {
        // Reversión automática por React 19 useOptimistic si no hay éxito
        toast({
          variant: "destructive",
          title: "Error al actualizar",
          description: result.message
        });
      }
    });
  };

  const disponibles = optimisticPrendas.filter(p => p.estado === 'Disponible');
  const fueraDeCirculacion = optimisticPrendas.filter(p => p.estado === 'Sucio' || p.estado === 'Lavandería');

  return (
    <div className="relative pb-24">
      <Tabs defaultValue="disponibles">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="disponibles">Disponibles ({disponibles.length})</TabsTrigger>
          <TabsTrigger value="sucias">Ropa Sucia ({fueraDeCirculacion.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="disponibles">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Prenda</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Acción Rápida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disponibles.map(prenda => (
                <ConsoleRow 
                  key={prenda._id} 
                  prenda={prenda} 
                  isSelected={selectedIds.includes(prenda._id!)}
                  onSelect={(checked) => {
                    setSelectedIds(prev => checked ? [...prev, prenda._id!] : prev.filter(id => id !== prenda._id));
                  }}
                  onStatusChange={(id, estado) => handleBulkStatusChange([id], estado)}
                />
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="sucias">
          {/* Estructura de tabla similar para la pestaña de fuera de circulación */}
        </TabsContent>
      </Tabs>

      {selectedIds.length > 0 && (
        <BulkActionBanner 
          selectedCount={selectedIds.length} 
          onBulkAction={(actionEstado) => handleBulkStatusChange(selectedIds, actionEstado)}
        />
      )}
    </div>
  );
}
```

---

### C. Rutas API e Infraestructura Backend

#### Endpoint de Actualización Masiva: `PATCH /api/prendas/bulk-status`
* **Método:** `PATCH`
* **Payload:**
  ```json
  {
    "ids": ["603d4f8f4f1a23001f3bb91a", "603d4f8f4f1a23001f3bb91b"],
    "estado": "Disponible"
  }
  ```
* **Respuesta de éxito (200 OK):**
  ```json
  {
    "success": true,
    "modifiedCount": 2,
    "message": "Se cambiaron 2 prendas al estado 'Disponible' con éxito."
  }
  ```
* **Respuesta de error (400 Bad Request):**
  ```json
  {
    "error": "El arreglo de ids está vacío o el estado no es válido."
  }
  ```

#### Server Action: `bulkUpdatePrendaEstadoAction`
```typescript
'use server';

import dbConnect from '@/lib/dbConnect';
import Prenda from '@/lib/models/Prenda';
import { revalidatePath } from 'next/cache';
import { EstadoPrenda } from '@/types/prenda';

export async function bulkUpdatePrendaEstadoAction(ids: string[], nuevoEstado: EstadoPrenda) {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: 'No se seleccionaron prendas.' };
    }

    await dbConnect();

    // Actualización masiva de documentos en MongoDB
    const result = await Prenda.updateMany(
      { _id: { $in: ids } },
      { $set: { estado: nuevoEstado } }
    );

    revalidatePath('/');
    revalidatePath('/admin');

    return { 
      success: true, 
      modifiedCount: result.modifiedCount,
      message: 'Actualización masiva persistida correctamente.' 
    };

  } catch (error) {
    console.error('Error al actualizar masivamente las prendas:', error);
    return { success: false, message: 'Fallo al procesar la transacción en el servidor.' };
  }
}
```

---

## 5. Especificación UX/UI

### Diseño y Maquetación de la Consola
* **Layout Móvil:** La tabla tradicional se contrae para convertirse en una lista de tarjetas compactas. Cada tarjeta contiene la foto pequeña de la prenda (60x60px), el nombre, y a la izquierda el Checkbox de selección rápida de 24x24px para evitar errores táctiles. La acción rápida se expone como un simple botón de icono circular en el extremo derecho.
* **Layout Desktop:** Tabla detallada de ancho completo. Columnas ordenables mediante clics en cabecera y el Banner de acciones masivas se fija en la parte inferior de la ventana cubriendo todo el ancho de forma flotante con fondo difuminado de cristal (`backdrop-blur-md bg-background/80 border-t`).

### Animaciones de la Interfaz
* **Tab Switch:** Deslizamiento dinámico del contenido al pasar de la pestaña "Disponibles" a "Ropa Sucia".
* **Desplazamiento Dinámico (List Transition):** Cuando un ítem cambia de estado, este se desvanece de su tabla actual (`scale-95 opacity-0 duration-300 transition-all`) y aparece en la tabla opuesta tras el refresco del estado, haciendo obvio el flujo de lavado.

### Accesibilidad (a11y)
* **Teclado en Tabs y Checkboxes:** El componente Tabs se activa con las flechas de dirección tras hacer foco en la cabecera. Los Checkboxes se seleccionan cómodamente usando la barra espaciadora (`Space`).
* **Lector de Pantalla (Aria-live):** Se añade un elemento oculto con el atributo `aria-live="polite"` que enuncia en tiempo real al usuario invidente cuando el estado de una prenda cambia de lista (ej. *"Camisa Azul Marino enviada a Ropa Sucia"*).

---

## 6. Casos de Prueba y QA

### Escenario 1: Actualización Masiva de Ropa Sucia a Disponible (Happy Path)
* **Acción:** El usuario ingresa a "Ropa Sucia", selecciona 3 prendas usando los checkboxes de la tabla y presiona el botón "Marcar seleccionados como Limpios (Disponibles)".
* **Proceso:** La interfaz aplica el estado optimista. La Server Action ejecuta el `updateMany` en la base de datos de MongoDB.
* **Resultado:** Las 3 prendas desaparecen simultáneamente de la lista actual de ropa sucia de forma instantánea. Se genera un Toast confirmando el cambio y, al ir a la pestaña de "Disponibles", los tres elementos ya se encuentran listados ahí.

### Escenario 2: Intentar Enviar Acción Masiva Sin Seleccionar Prendas (Edge Case)
* **Acción:** Intento de envío forzado del evento de actualización con un arreglo vacío.
* **Proceso:** El botón de acción masiva en el componente `BulkActionBanner` se mantiene oculto a menos que `selectedIds.length > 0`. La Server Action, por su parte, comprueba la longitud del arreglo.
* **Resultado:** La interfaz no expone los botones de acción masiva, y la llamada backend devuelve una validación fallida con HTTP 400.
