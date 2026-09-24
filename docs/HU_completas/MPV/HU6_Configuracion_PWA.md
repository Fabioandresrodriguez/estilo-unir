# HU-6: Configuración de PWA Completa, Metadatos e Instalación Recomendada

## 📝 Descripción (Formato Connextra)
* **Como** usuario móvil del Clóset Digital,
* **Quiero** poder instalar la aplicación directamente en mi pantalla de inicio como una PWA y recibir una recomendación visual para instalarla si no lo he hecho,
* **Para** acceder rápidamente a mi guardarropa desde un icono nativo, experimentar una interfaz sin barras de navegación del navegador y poder silenciar las invitaciones de instalación de manera persistente si así lo decido.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Detección y despliegue del banner de recomendación en navegador móvil
* **Dado que** el usuario ingresa a la aplicación Clóset Digital mediante un navegador web móvil compatible,
* **Y** no tiene la aplicación instalada en modo standalone (nativa PWA),
* **Y** no ha activado previamente la opción "No volver a sugerir",
* **Cuando** la página principal termina de cargar en el cliente,
* **Entonces** se muestra un banner/notificación con estilo RawBlock Brutalista recomendando instalar la aplicación con un acceso directo,
* **Y** se expone un botón "Instalar" y un enlace/botón "No volver a sugerir".

### Escenario 2: Instalación exitosa utilizando el banner
* **Dado que** el banner de recomendación de instalación es visible en la pantalla del usuario,
* **Cuando** el usuario hace clic o presiona el botón "Instalar",
* **Entonces** el sistema captura e invoca el prompt de instalación nativo del navegador (`beforeinstallprompt`),
* **Y** oculta el banner temporalmente mientras el navegador procesa la instalación.

### Escenario 3: Rechazo persistente de la sugerencia de instalación
* **Dado que** el banner de recomendación de instalación es visible en la pantalla del usuario,
* **Cuando** el usuario hace clic en el botón "No volver a sugerir",
* **Entonces** el sistema guarda esta preferencia (`pwa_installation_dismissed: true`) de manera persistente en el navegador del usuario (usando `localStorage`),
* **Y** remueve inmediatamente el banner de la interfaz,
* **Y** no vuelve a mostrar el banner de recomendación en futuras visitas a la aplicación.

### Escenario 4: Ejecución en modo PWA standalone (sin banner)
* **Dado que** el usuario abre la aplicación Clóset Digital desde el acceso directo instalado (modo standalone/PWA),
* **Cuando** la aplicación inicia,
* **Entonces** la aplicación detecta que ya se está ejecutando como PWA nativa,
* **Y** no despliega el banner de recomendación de instalación en ningún momento de la navegación.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Persistencia:** La preferencia de "No volver a sugerir" debe ser almacenada localmente en el cliente a través de `localStorage` y verificada en cada inicio de la aplicación en el lado del cliente.
* **Estilo Visual:** El banner de instalación PWA debe seguir la estética **RawBlock Brutalista** del MVP: bordes gruesos de color negro (`border-[3px] border-black`), sombras prominentes sin difuminado, fuentes monoespaciadas y botones con efectos de desplazamiento (hover active) de alto contraste.
* **Formatos de Iconos:** Se deben registrar y mapear los iconos provistos en la ruta `iconos_de_app_eliminartpm` de manera correcta dentro de la estructura pública del manifest.
* **Compatibilidad de Navegación:** El Service Worker básico debe registrarse de manera asíncrona solo en el lado del cliente y en entornos de producción o desarrollo local seguro.
* **Accesibilidad (WCAG 2.2):**
  - El banner debe ser completamente operable mediante teclado (foco accesible).
  - Los botones interactivos de instalación y rechazo deben poseer etiquetas descriptivas para lectores de pantalla (`aria-label`).
  - Debe mantenerse una relación de contraste adecuada para el texto y las acciones.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Mejora drásticamente la retención y la experiencia del usuario móvil en un MVP enfocado en su uso rápido).
* **Estimación Sugerida (Story Points):** 3
* **Dependencias:** Ninguna (Configuración transversal de la aplicación).
* **Notas Técnicas Adicionales:**
  - Implementar la configuración de `manifest.ts` nativa en el App Router de Next.js (`app/manifest.ts`) para generar el archivo `/manifest.webmanifest` de forma dinámica.
  - Copiar los archivos `.ico` de la carpeta `iconos_de_app_eliminartpm/` a `public/icons/` y declararlos con sus tamaños respectivos en el array de iconos.
  - Crear un Service Worker minimalista en `public/sw.js` para habilitar el soporte offline básico y cumplir los requisitos de instalación de Chromium.
  - Implementar un componente de React de cliente (`components/pwa/PwaInstallPrompt.tsx`) con un manejador del evento `beforeinstallprompt` y detección del display-mode `standalone` a través de media query.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU6 feat: configuración de PWA e indicador de instalación`).
