# HU1: Registro y Captura de Prenda

## 1. Identificador y Título
* **ID:** HU1
* **Título:** Registro y Captura de Prenda

---

## 2. Historia de Usuario
**Como** usuario del Clóset Digital,  
**Quiero** registrar una nueva prenda en mi inventario subiendo sus fotos (ya sea capturándolas con la cámara de mi móvil o seleccionándolas de mi galería) y rellenando sus datos básicos,  
**Para** digitalizar mi guardarropa de forma ágil y mantener mi catálogo al día.

---

## 3. Criterios de Aceptación Funcionales
- [ ] **Captura Multi-Foto:** Permite la carga de hasta 4 imágenes por prenda.
- [ ] **Acceso a Cámara Integrada:** Si el dispositivo cuenta con cámara (móvil o laptop), la interfaz debe ofrecer un disparador en tiempo real para tomar las fotos directamente, además de la carga tradicional desde la galería del dispositivo.
- [ ] **Validación Estricta:** No se permite guardar la prenda si faltan campos obligatorios (`nombre`, `imagenes`, `categoria`, `subcategoria`, `colores`, `estaciones`, `estilo`, `talla`).
- [ ] **Estado Inicial:** Cada nueva prenda registrada debe guardarse automáticamente con el estado `"Disponible"`.
- [ ] **Formulario Dinámico:** La selección de `subcategoria` debe habilitarse y poblarse dinámicamente según la `categoria` seleccionada (según relaciones de HU0).

---

## 4. Especificación Técnica y Arquitectura

### A. Componentes UI (shadcn/ui y Custom)
Se estructurará el formulario utilizando componentes de diseño modulares:

#### Componentes de `shadcn/ui`
* **Card (`@/components/ui/card`):** Estructura contenedora del formulario.
* **Form (`@/components/ui/form`):** Wrapper react-hook-form con soporte de validación integrada.
* **Input (`@/components/ui/input`):** Campo de texto para el nombre de la prenda y notas.
* **Select (`@/components/ui/select`):** Para elegir categoría y subcategoría jerárquicas.
* **Dialog (`@/components/ui/dialog`):** Ventana emergente (modal) para abrir la cámara de captura en dispositivos móviles y de escritorio.
* **Button (`@/components/ui/button`):** Acciones de guardado y disparo de la cámara.
* **Alert (`@/components/ui/alert`):** Mensajes en caso de fallos de red o de validación insalvables.

#### Componentes Custom
* **`MultiImageUpload` (`@/components/prendas/MultiImageUpload.tsx`):** Grid visual que muestra previsualizaciones de las fotos cargadas, botón para agregar más fotos y opción de remover fotos individuales.
* **`CameraCapture` (`@/components/prendas/CameraCapture.tsx`):** Componente interactivo dentro del Dialog que activa la cámara del dispositivo, renderiza un streaming de video en directo y captura un fotograma al hacer clic en "Capturar".

### B. Gestión de Estado y Formulario
El formulario utiliza **`react-hook-form`** con el resolvedor de **`Zod`** (`@hookform/resolvers/zod`).

```typescript
// Lógica base de inicialización del Formulario en React
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PrendaZodSchema, PrendaInput } from '@/lib/validations/prenda';

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
```

* **Estado Local (`useState`):**
  * `imagenesPrevia`: Arreglo de strings en Base64 o URLs temporales (`URL.createObjectURL(file)`) para renderizar las vistas previas de las fotos seleccionadas antes del envío.
  * `isCameraOpen`: Booleano para controlar el ciclo de vida del stream de la cámara y evitar consumo de batería cuando el modal de captura está cerrado.
  * `uploading`: Booleano para el estado de carga al subir las imágenes al servidor de archivos.

---

### C. Rutas API y Mecanismo de Almacenamiento

El flujo de envío de datos consta de dos pasos para optimizar el almacenamiento:
1. **Subida de Archivos:** Las imágenes locales se envían a un endpoint REST mediante `FormData` que procesa los archivos binarios, los sube a un servidor de almacenamiento en la nube (ej. Cloudinary, AWS S3, etc.) y retorna las URLs estáticas.
2. **Registro de Metadatos (Server Action):** Se realiza una llamada a una Server Action de Next.js pasándole el objeto de la prenda validado con las URLs devueltas en el paso 1.

#### Endpoint de Carga de Imágenes: `POST /api/upload`
* **Método:** `POST`
* **Content-Type:** `multipart/form-data`
* **Payload:** Uno o varios archivos binarios en el campo `files`.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "urls": [
      "https://res.cloudinary.com/mi-closet/image/upload/v1234/prenda_1.jpg",
      "https://res.cloudinary.com/mi-closet/image/upload/v1234/prenda_2.jpg"
    ]
  }
  ```
* **Respuesta Errónea (400 Bad Request - Archivo pesado o no válido):**
  ```json
  {
    "error": "El archivo excede el tamaño máximo permitido (5MB) o el formato no es compatible (JPG/PNG)."
  }
  ```

#### Server Action de Registro: `createPrendaAction`
```typescript
'use server';

import dbConnect from '@/lib/dbConnect';
import Prenda from '@/lib/models/Prenda';
import { PrendaZodSchema } from '@/lib/validations/prenda';
import { revalidatePath } from 'next/cache';

export async function createPrendaAction(prevState: any, formData: unknown) {
  try {
    // 1. Conexión a Base de Datos
    await dbConnect();

    // 2. Validación de Esquema con Zod
    const validatedData = PrendaZodSchema.safeParse(formData);
    
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors,
        message: 'Datos de la prenda inválidos.'
      };
    }

    // 3. Inserción en Base de Datos
    const nuevaPrenda = new Prenda(validatedData.data);
    await nuevaPrenda.save();

    // 4. Revalidación de Caché de la galería
    revalidatePath('/');
    
    return {
      success: true,
      message: 'Prenda registrada con éxito en el guardarropa.'
    };

  } catch (error: any) {
    console.error('Error en Server Action createPrendaAction:', error);
    return {
      success: false,
      message: 'Error interno en el servidor al guardar la prenda.'
    };
  }
}
```

---

## 5. Especificación UX/UI

### Layout Adaptativo (Mobile first)
* **Diseño Mobile (Retrato):** El formulario se distribuye en una sola columna. El bloque de carga de fotos se ubica en la cabecera del formulario para facilitar la interacción táctil inmediata. Los selectores de colores y estilos se muestran en grids de 3 o 4 columnas con botones grandes y redondeados que sirven como toggles.
* **Diseño Desktop (Paisaje):** Vista dividida en dos paneles (2 columnas): el panel izquierdo contiene el cargador de imágenes y el carrusel de previsualización; el panel derecho contiene los campos de texto, selectores dinámicos y notas.

### Interacciones y Micro-animaciones
* **Carga de Archivo Dropzone:** Efecto de cambio de borde de línea discontinua a línea continua gruesa al arrastrar una foto sobre el área (`hover:border-primary transition-all duration-300`).
* **Visualización de Previsualización:** Las fotos añadidas aparecen con una transición tipo rebote suave (`animate-in zoom-in-95 duration-200`).
* **Estado de Envío (Loading):** Al presionar "Guardar Prenda", el botón entra en estado deshabilitado (`disabled`), el texto cambia a "Guardando..." y se renderiza un spinner animado de shadcn (`animate-spin`).

### Accesibilidad (a11y)
* **Navegación con Teclado:** Se puede alternar el foco mediante `Tab` en todos los inputs, selectores y en los botones de "Eliminar Foto".
* **Atributos Aria:**
  * El botón de la cámara posee `aria-haspopup="dialog"`.
  * La zona de visualización de fotos cuenta con `role="region" aria-label="Previsualización de fotos de la prenda"`.
* **Cierre de Cámara:** El modal de la cámara puede cerrarse pulsando la tecla `Escape`. Al cerrarse, el stream del video se detiene de forma explícita liberando el hardware de la cámara (`track.stop()`).

---

## 6. Lógica de Captura por Cámara (Código de Referencia)

```typescript
// Implementación interna del streaming y captura en el componente Custom CameraCapture
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function CameraCapture({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Cámara trasera en móviles por defecto
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('No se pudo acceder a la cámara:', err);
      }
    }
    startCamera();

    // Cleanup: Detener cámara al desmontar
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) onCapture(blob);
        }, 'image/jpeg', 0.85);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
      </div>
      <Button onClick={capturePhoto} type="button" className="w-full">
        Capturar Fotografía
      </Button>
    </div>
  );
}
```

---

## 7. Casos de Prueba y QA

### Escenario 1: Envío de Formulario Vacío (Edge Case)
* **Acción:** El usuario presiona el botón "Guardar Prenda" sin ingresar datos.
* **Proceso:** La validación local de Zod detiene la petición.
* **Resultado:** Se marcan todos los inputs requeridos en rojo y aparecen mensajes descriptivos debajo de cada campo (ej. "El nombre es obligatorio", "Debe subir al menos una imagen"). El foco se desplaza automáticamente al primer campo erróneo.

### Escenario 2: Límite de Fotos Superado (Edge Case)
* **Acción:** El usuario intenta agregar una quinta foto.
* **Proceso:** El componente `MultiImageUpload` detecta que la longitud del arreglo es 4 y deshabilita la zona de arrastre/botón de cámara. Si intenta inyectarse por código, la Server Action lo detiene en la validación del esquema de negocio.
* **Resultado:** El botón de carga está inhabilitado y se muestra un mensaje explicativo: *"Límite máximo de 4 fotografías alcanzado."*
