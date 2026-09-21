# 3. Flujo de Navegación y Arquitectura de la Información (Next.js App Router)

Este diagrama detalla cómo se organizan las vistas en el **App Router de Next.js**, cómo fluye el usuario entre las diferentes secciones y cómo interactúan las rutas con la sincronización de la URL (`SearchParams`) y los estados interactivos.

---

## 🗺️ Mapa de Arquitectura y Navegación en Mermaid

El siguiente diagrama de flujo detalla la jerarquía de directorios de Next.js, indicando si los componentes se ejecutan en el servidor (**Server Component / RSC**) o en el cliente (**Client Component**), y cómo se relacionan entre sí.

```mermaid
graph TD
    %% Estilos de nodos
    classDef layout fill:#e0f7fa,stroke:#00acc1,stroke-width:2px;
    classDef rsc fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef client fill:#fff3e0,stroke:#ffb74d,stroke-width:2px;
    classDef action fill:#f1f8e9,stroke:#7cb342,stroke-width:2px;

    %% Nivel Root
    L_Root["Root Layout<br>(/app/layout.tsx)<br><i>Shared Navbar, Global CSS & Theme</i>"]:::layout

    %% Sub-rutas principales
    P_Home["Galería Clóset<br>(/app/page.tsx)<br><i>RSC - Carga inicial de prendas</i>"]:::rsc
    P_Registrar["Registro Prenda<br>(/app/prendas/registrar/page.tsx)<br><i>RSC - Estructura de formulario</i>"]:::rsc
    P_Admin["Consola Ropa Sucia<br>(/app/administracion/page.tsx)<br><i>RSC - Panel de disponibilidad</i>"]:::rsc

    %% Relación Layout a Páginas
    L_Root --> P_Home
    L_Root --> P_Registrar
    L_Root --> P_Admin

    %% Interactividad en Home (Galería)
    C_GaleriaClient["Filtros e Interacción<br>(Client Component)<br><i>Actualiza URL SearchParams</i>"]:::client
    P_Home --> C_GaleriaClient
    
    C_PrendaCard["Tarjeta Prenda<br>(Client Component)<br><i>Opacidad y Click Handler</i>"]:::client
    C_GaleriaClient --> C_PrendaCard

    %% Detalle de Prenda (HU3)
    P_DetalleModal["Detalle Prenda<br>(/app/prendas/[id]/page.tsx o Intercepted Route)<br><i>Adaptativo: Dialog (PC) / Drawer (Móvil)</i>"]:::client
    C_PrendaCard -->|Clic / Abrir Detalle| P_DetalleModal

    %% Interactividad en Registro (HU1)
    C_RegForm["Formulario Registro<br>(Client Component)<br><i>react-hook-form + zod</i>"]:::client
    C_Camera["Cámara Component<br>(Client Component)<br><i>navigator.mediaDevices.getUserMedia</i>"]:::client
    
    P_Registrar --> C_RegForm
    C_RegForm --> C_Camera

    %% Interactividad en Administración (HU4)
    C_AdminTabs["Panel Pestañas & Checkboxes<br>(Client Component)<br><i>useOptimistic para cambios rápidos</i>"]:::client
    P_Admin --> C_AdminTabs

    %% Server Actions (Mutaciones)
    A_CrearPrenda["Server Action<br>crearPrenda(formData)"]:::action
    A_ToggleDispo["Server Action<br>transicionarEstadoPrenda()"]:::action
    A_BulkUpdate["Server Action<br>actualizarEstadosMasivos()"]:::action

    C_RegForm -->|Submit| A_CrearPrenda
    P_DetalleModal -->|Toggle Disponibilidad| A_ToggleDispo
    C_AdminTabs -->|Enviar a Lavar / Limpiar| A_BulkUpdate

    %% Revalidación
    A_CrearPrenda -->|revalidatePath| P_Home
    A_ToggleDispo -->|revalidatePath| P_Home
    A_ToggleDispo -->|revalidatePath| P_Admin
    A_BulkUpdate -->|revalidatePath| P_Home
    A_BulkUpdate -->|revalidatePath| P_Admin
```

---

## 🚦 Leyenda del Diagrama
* **Root Layout (`layout.tsx`):** Componente estructural de Next.js que envuelve a toda la aplicación. Provee la barra de navegación global (`Navbar`), el pie de página (`Footer`), e inyecta la configuración del tema (Modo Claro/Oscuro).
* **Server Components (RSC):** Renderizados en el servidor para mejorar el SEO y la velocidad de carga de datos directamente desde MongoDB.
* **Client Components (`"use client"`):** Componentes con interactividad, hooks de React (`useState`, `useEffect`, `useOptimistic`), o APIs del navegador (Cámara, MediaRecorder, eventos de tacto en carrusel).
* **Server Actions:** Funciones asíncronas seguras que corren en el servidor y gestionan las mutaciones de base de datos sin requerir endpoints de API REST tradicionales.

---

## 🔗 Estructura de Rutas y Direccionamiento

### 1. `/` (Galería / Dashboard Principal)
* **Propósito:** Mostrar la cuadrícula visual de prendas registradas.
* **Sincronización con URL (SearchParams):**
  - Los filtros de búsqueda no guardan estado en memoria local, sino en la URL (ej. `/?categoria=Superior&colores=Negro&estado=Disponible`).
  - Esto permite copiar la URL y compartir búsquedas exactas, o volver atrás en el historial del navegador de forma natural.
* **Flujo de Navegación:**
  - El usuario puede hacer clic en cualquier tarjeta de prenda para abrir el detalle.
  - Cuenta con un botón de acción flotante (FAB) en móviles o un botón destacado en la barra de navegación para ir a `/prendas/registrar`.

### 2. `/prendas/registrar` (Registro de Ropa)
* **Propósito:** Digitalizar e ingresar una nueva prenda al sistema.
* **Flujo de Navegación:**
  - Al completar exitosamente el registro, la Server Action realiza la mutación e invoca `revalidatePath('/')` y `redirect('/')`, devolviendo al usuario a la pantalla principal con la nueva prenda agregada en el primer lugar del grid.

### 3. `/prendas/[id]` o Intercepted Modals (`/app/@modal/(.)prendas/[id]`)
* **Propósito:** Mostrar el detalle ampliado de una prenda.
* **Técnica Next.js (Intercepted Routes):**
  - Cuando el usuario navega desde la Galería (`/`), Next.js intercepta la ruta y abre el detalle en un modal superpuesto (Dialog/Drawer) sin recargar la página entera y sin perder la posición de scroll de la galería.
  - Si el usuario recarga la página o accede directamente al enlace (`http://dominio.com/prendas/123`), se renderiza como una página independiente de pantalla completa (`/app/prendas/[id]/page.tsx`), garantizando indexabilidad por buscadores y consistencia al compartir enlaces.

### 4. `/administracion` (Consola de Disponibilidad de Ropa)
* **Propósito:** Control operativo rápido del estado de las prendas.
* **Flujo de Navegación:**
  - Accesible desde el menú de navegación principal (`Navbar`).
  - Implementa dos pestañas principales controladas por el componente `Tabs` de shadcn/ui.
  - El usuario puede seleccionar múltiples prendas y transicionar sus estados masivamente, lo cual actualiza la UI de forma optimista e invalida la caché de la galería mediante Server Actions.
