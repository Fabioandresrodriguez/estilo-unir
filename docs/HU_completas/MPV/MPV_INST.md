# Especificación Técnica y de Negocio: Clóset Digital (MVP)

Este directorio contiene la documentación técnica y de negocio detallada para el desarrollo del MVP de la aplicación de gestión de guardarropa **Clóset Digital** (estilo *Fits*). La documentación ha sido estructurada para guiar a los desarrolladores de principio a fin, garantizando consistencia, accesibilidad (WCAG 2.2) y una excelente experiencia de usuario (UX/UI).

---

## 🗺️ Índice de la Documentación

1. **[HU0: Investigación de Catálogos y Modelo de Datos](HU0_Investigacion_Catalogos.md)**  
   *Especificación del modelo de datos principal (Prenda), estructuración jerárquica de catálogos estandarizados (categorías, subcategorías, colores, clima, ocasión), esquemas Mongoose y Zod, y script de inicialización de datos (seed).*
2. **[HU1: Registro y Captura de Prenda](HU1_Registro_Prenda.md)**  
   *Especificación del formulario de captura (carga local/cámara, validación react-hook-form + zod, guardado en base de datos).*
3. **[HU2: Galería de Guardarropa](HU2_Vista_Galeria.md)**  
   *Diseño de la interfaz de visualización principal en cuadrícula responsiva, filtros dinámicos, carga perezosa (lazy loading) e indicadores de disponibilidad.*
4. **[HU3: Vista de Detalle de Prenda](HU3_Detalle_Prenda.md)**  
   *Especificación del detalle extendido (modal/carrusel), desglose de metadatos con badges y acción rápida de disponibilidad.*
5. **[HU4: Consola de Administración de Disponibilidad](HU4_Gestion_Disponibilidad.md)**  
   *Diseño del panel operativo con pestañas dinámicas (Disponible vs. Sucio/Lavandería) y soporte para actualizaciones de estado masivas e individuales.*
6. **[📐 Diagramas del Sistema](diagrams/README.md)**  
   *Diagrama de modelo de datos (E-R), máquina de transición de estados y flujo de navegación con arquitectura de la información (Next.js App Router).*
7. **[📈 Estado de Progreso del Proyecto](PROGRESO.md)**  
   *Bitácora de tareas completadas, estado actual de las Historias de Usuario, y plan de trabajo para la siguiente sesión de desarrollo.*

---

## 🏗️ Arquitectura del Sistema

La arquitectura de la aplicación está construida sobre un stack moderno y optimizado para el rendimiento y la mantenibilidad, alineado con **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** y **Mongoose / MongoDB**.

```mermaid
graph TD
    subgraph Client ["Cliente (Browser)"]
        UI["UI (React 19 + shadcn/ui)"]
        Hooks["Hooks (useActionState, useFormStatus, etc.)"]
        State["Estado de UI (URL SearchParams / React Context)"]
    end

    subgraph Server ["Next.js 16 Server (App Router)"]
        RSC["React Server Components (Páginas/Layouts)"]
        Actions["Server Actions (Mutaciones de Datos)"]
        API["Route Handlers (GET /api/prendas)"]
    end

    subgraph Database ["Base de Datos"]
        Mongo["MongoDB (Mongoose schemas)"]
    end

    UI -->|Acciones del Usuario / Forms| Actions
    UI -->|Filtros / URL Sync| State
    RSC -->|Renderizado Inicial / SSR| UI
    State -->|Fetch de Datos (Search Params)| RSC
    Actions -->|Lectura / Escritura| Mongo
    API -->|Fetch de Datos (Client-side)| Mongo
    RSC -->|Query Directo Mongoose| Mongo
```

### Componentes de la Arquitectura

1. **Frontend (Capa de Cliente):**
   * **React 19 & Next.js 16:** Utiliza Server Components (RSC) para el renderizado inicial rápido y carga de datos directa desde la base de datos (evitando cascadas de fetch en el cliente). Se implementan Client Components (`"use client"`) para formularios interactivos, modales y lógica de captura de cámara.
   * **Tailwind CSS v4:** Motor de estilos utilitarios que utiliza la nueva especificación CSS-first (configuración a través de variables CSS nativas en `app/globals.css`, eliminando el antiguo `tailwind.config.js`).
   * **shadcn/ui:** Componentes de diseño basados en Radix Primitives y adaptados para Tailwind CSS v4. Aportan una base accesible (cumplimiento WCAG) y listos para usar en un entorno responsive.

2. **Backend (Capa de Servidor):**
   * **Server Actions:** Mecanismo principal de mutación de datos (por ejemplo, registrar una prenda en HU1 o actualizar estados masivos en HU4). Aprovecha la integración directa con React 19 usando los hooks `useActionState` para gestionar respuestas del servidor de forma nativa.
   * **Route Handlers (`app/api/`):** Utilizados para flujos específicos que requieren APIs REST tradicionales (por ejemplo, endpoints de subida de imágenes o endpoints de paginación que consuma la galería en un Infinite Scroll).
   * **Mongoose (v9.7.0):** Modelado y mapeo de datos para MongoDB, garantizando integridad en las relaciones y validaciones a nivel de base de datos.

3. **Base de Datos (Capa de Persistencia):**
   * **MongoDB:** Base de datos documental NoSQL. Permite almacenar prendas de ropa con flexibilidad en su metadata estructurada y múltiples arreglos de imágenes.

---

## 📅 Plan de Iteraciones y Ruta de Desarrollo

El desarrollo del MVP se divide en **5 iteraciones** sucesivas, diseñadas para desbloquear dependencias técnicas de forma lógica.

```mermaid
gantt
    title Plan de Iteraciones - MVP Clóset Digital
    dateFormat  YYYY-MM-DD
    section Iteración 0
    HU0: Base de Datos y Catálogos :active, h0, 2026-06-14, 3d
    section Iteración 1
    HU1: Captura e Ingreso de Prendas : h1, after h0, 4d
    section Iteración 2
    HU2: Visualización y Filtros de Galería : h2, after h1, 4d
    section Iteración 3
    HU3: Detalle e Información de Prenda : h3, after h2, 3d
    section Iteración 4
    HU4: Consola de Ropa Sucia y Lavado : h4, after h3, 4d
```

### Detalle de las Iteraciones

### **Iteración 0: Cimientos y Modelado de Datos (HU0)**
* **Objetivo:** Definir el esquema conceptual de la base de datos y proveer datos estandarizados para que el resto de las funcionalidades no tengan inconsistencias.
* **Entregables:**
  * Esquema Mongoose para `Prenda`.
  * Catálogos normalizados estáticos/dinámicos (categorías, subcategorías, colores, estaciones, estilos).
  * Validaciones Zod de entrada/salida.
  * Script `seed.ts` para inicialización del sistema con 20 prendas simuladas en distintos estados y con imágenes de marcador de posición (placeholder).

### **Iteración 1: Ingreso de Inventario (HU1)**
* **Objetivo:** Permitir al usuario digitalizar su clóset.
* **Entregables:**
  * Formulario de registro responsivo.
  * Integración con la API de Cámara del dispositivo (`navigator.mediaDevices.getUserMedia`) y carga de archivos locales.
  * Server Action para guardar prendas con validación Zod.
  * Subida de imágenes a almacenamiento de archivos.

### **Iteración 2: Galería de Visualización (HU2)**
* **Objetivo:** Proveer una vista limpia, rápida e intuitiva del guardarropa.
* **Entregables:**
  * Grid responsiva de prendas con `next/image` y placeholders de carga.
  * Filtros de búsqueda basados en URL (Search Params) para permitir compartir y guardar búsquedas de prendas.
  * Tratamiento visual diferenciado para prendas fuera de servicio (estado **Sucio** o **En Lavandería** con opacidad reducida).

### **Iteración 3: Detalle y Operación Rápida (HU3)**
* **Objetivo:** Visualizar toda la metadata de una prenda específica sin perder el contexto de la galería.
* **Entregables:**
  * Modal adaptativo (Dialog en desktop, Drawer en móvil).
  * Carrusel interactivo para múltiples imágenes.
  * Badges con el desglose de metadata (talla, color, estación, estilo).
  * Switch rápido de disponibilidad (cambio de estado inmediato con feedback visual).

### **Iteración 4: Control de Ciclo de Limpieza (HU4)**
* **Objetivo:** Automatizar la transición de estados de las prendas para la toma de decisiones diaria.
* **Entregables:**
  * Panel de control de disponibilidad dividido en pestañas (Disponibles vs. Fuera de Circulación).
  * Checkboxes de selección múltiple e individual.
  * Acción masiva de lavado/limpieza ("Marcar todo como Limpio").
  * Feedback inmediato en la UI usando actualizaciones optimistas (Optimistic UI) para mejorar la percepción de velocidad.
