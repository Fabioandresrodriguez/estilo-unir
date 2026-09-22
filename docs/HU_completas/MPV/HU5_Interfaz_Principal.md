# HU5: Interfaz Principal y Rediseño de UI/UX

## 1. Identificador y Título
* **ID:** HU5
* **Título:** Interfaz Principal y Rediseño de UI/UX

---

## 2. Historia de Usuario
**Como** usuario con estilo del Clóset Digital,  
**Quiero** disponer de una interfaz principal moderna, inmersiva y de inspiración en redes sociales,  
**Para** navegar intuitivamente entre sugerencias de moda basadas en Inteligencia Artificial, planificar mis conjuntos diarios (OOTD), acceder a herramientas operativas mediante atajos rápidos y revisar mis combinaciones recientes.

---

## 3. Criterios de Aceptación Funcionales
- [x] **Barra Superior (Encabezado):**
  - Logotipo de la aplicación a la izquierda acompañado de un icono de gancho estilizado.
  - Botón central de "Actualizar" con diseño ovalado e icono de destellos (representando la interacción de IA).
  - Accesos rápidos a la derecha con iconos de campana (notificaciones) y lupa (búsqueda).
- [x] **Carrusel de Historias / Canales:**
  - Fila horizontal interactiva y deslizable estilo "Stories" de red social.
  - Círculo de "Comunidad" (icono de grupo).
  - Círculo de "Tu OOTD" en color azul con un botón (+) para agregar nuevos conjuntos diarios.
  - Círculos de canales/perfiles adicionales como perfiles sugeridos y "zanzi" con avatares personalizados.
- [x] **Sección "Estilista AI":**
  - Tarjetas visuales de gran formato con imágenes fotográficas.
  - Tarjeta de "Crear un conjunto" con fotos de modelos y el subtítulo *"Para cualquier fecha, ocasión y estilo"*.
  - Tarjeta de "Califica mi conjunto" parcialmente visible con fotos de modelos e icono de pulgar hacia abajo para dar retroalimentación de estilo.
- [x] **Sección "Atajos":**
  - Grid de navegación rápida con fondo gris claro y bordes definidos.
  - Botón "Planificador" con icono de calendario.
  - Botón "Vestidor" con icono de maniquí de costura.
  - Botón "Prueba con IA" con icono de gancho de ropa con destellos mágicos.
  - Botón "Selfie" con icono de persona tomándose una foto.
- [x] **Sección "Conjuntos Recientes":**
  - Tarjetas superpuestas en la parte inferior que muestran combinaciones recientes.
  - Mezcla visual de fotos de modelos reales y prendas del catálogo individual sobre fondo blanco y limpio.
- [x] **Barra de Navegación Inferior:**
  - Barra de navegación global fija en la parte inferior de la pantalla.
  - Botón de "Inicio" con icono de casa (marcado como activo por defecto).
  - Botón central destacado (+) de color negro y signo más en blanco para añadir contenido de manera expedita.
  - Botón de "Perfil" con icono de silueta humana.

---

## 4. Especificación Técnica y Arquitectura

### A. Componentes UI (shadcn/ui y Custom)
* **Scroll Area (`@/components/ui/scroll-area`):** Para habilitar el deslizamiento horizontal suave en la fila de historias sin mostrar barras de scroll toscas.
* **Button (`@/components/ui/button`):** Botones brutalistas de atajos, el botón central de navegación y el botón ovalado de actualización.
* **Card (`@/components/ui/card`):** Estructura base para las tarjetas del "Estilista AI" y los "Conjuntos recientes".
* **Avatar (`@/components/ui/avatar`):** Círculos adaptativos para los perfiles del carrusel de historias (perfiles sugeridos, "zanzi" y "Comunidad").

### B. Iconografía (Lucide React)
Se utilizarán los siguientes iconos de `lucide-react`:
* **Gancho de ropa estilizado:** `Shirt` o `Layers` (personalizado para simular percha).
* **Actualización con IA (Destellos):** `Sparkles`.
* **Notificaciones:** `Bell`.
* **Búsqueda:** `Search`.
* **Comunidad:** `Users`.
* **Planificador:** `Calendar`.
* **Vestidor:** `Accessibility` (maniquí).
* **Selfie:** `Camera`.
* **Inicio:** `Home`.
* **Perfil:** `User`.
* **Añadir (+):** `Plus`.

---

## 5. Especificación UX/UI

### Diseño Brutalista "RawBlock" Adaptado para la Interfaz
* **Esquinas y Bordes:** Se mantiene la estética de esquinas completamente rectas (`border-radius: 0px`) y bordes de trazo grueso (3px a 5px en negro sólido) que identifican al sistema RawBlock del proyecto.
* **Fondo y Contrastes:** Fondo blanco y gris claro (`bg-[#F3F4F6]`) para los atajos y secciones secundarias. Se destacan los elementos de IA e historias con acentos de color puro (azul eléctrico para OOTD, verde para éxitos).
* **Interacciones del Carrusel:** El carrusel de historias y los conjuntos recientes deben admitir gestos de arrastre táctil (swipe) mediante CSS `overflow-x-auto snap-x scrollbar-none`.

---

## 6. Casos de Prueba y QA

### Escenario 1: Navegación por Atajos (Happy Path)
* **Acción:** El usuario pulsa sobre el atajo "Planificador" o "Vestidor".
* **Proceso:** La interfaz responde aplicando un escalado inverso brutalista (efecto presionado active: `translate-x-[3px] translate-y-[3px] shadow-none`).
* **Resultado:** Se redirige al usuario a la sección correspondiente del sistema.

### Escenario 2: Desplazamiento del Carrusel de Historias (Happy Path)
* **Acción:** El usuario realiza un gesto de deslizamiento horizontal sobre las historias en un dispositivo móvil.
* **Proceso:** La fila se desplaza de forma fluida con alineación magnética (`snap-align-start`).
* **Resultado:** Se revelan avatares adicionales sin alterar el flujo vertical de la página.
