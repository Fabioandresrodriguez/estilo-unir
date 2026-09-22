# HU-10: Canvas Brutalista de Recomendación "Qué me pongo hoy" con Espectrograma Animado

## 📝 Descripción (Formato Connextra)
* **Como** usuario que prefiere interactuar por voz en el Clóset Digital,
* **Quiero** una interfaz limpia en `/prendas/recomendacion-hoy` con un visualizador de espectrograma o frecuencia que reaccione dinámicamente al volumen y estado de mi voz,
* **Para** recibir retroalimentación visual inmediata durante la conversación hablada con la Inteligencia Artificial.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Espectrograma en estado de escucha activa (User Speaking)
* **Dado que** el usuario presiona el botón de "Iniciar conversación por voz" en `/prendas/recomendacion-hoy`,
* **Y** otorga el permiso de micrófono en su navegador,
* **Cuando** el usuario empieza a hablar para indicar su contexto del día,
* **Entonces** el espectrograma (ondas visuales brutalistas) reacciona modificando su amplitud y velocidad en tiempo real de acuerdo con el volumen de entrada del micrófono.

### Escenario 2: Espectrograma en estado de respuesta o pensamiento (AI Processing)
* **Dado que** el usuario ha terminado de hablar y el asistente comienza a procesar la respuesta o a hablar de vuelta (TTS),
* **Cuando** la IA está emitiendo o computando datos,
* **Entonces** la animación del espectrograma cambia a un patrón rítmico constante (e.g. onda senoidal controlada) indicando que la app está respondiendo,
* **Y** regresa a un estado de latencia sutil en silencio absoluto.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Estilo Visual:** El visualizador debe seguir la estética **RawBlock Brutalista** (bloques de ondas gruesos y pixelados, color negro sobre fondo blanco o amarillo sólido con bordes de `border-[3px] border-black` y sombras duras).
* **Reactividad:** El espectrograma debe alimentarse dinámicamente de la amplitud de sonido del micrófono (usando la API `AudioContext` y `AnalyserNode` nativos del navegador) cuando la conversación de voz esté activa.
* **Accesibilidad (WCAG 2.2):**
  - Debe proveerse una alternativa textual legible mediante `aria-label="Espectrograma de voz activo"` para informar a usuarios de lectores de pantalla sobre el estado del micrófono.
  - El espectrograma visual debe poder desactivarse de manera manual mediante un atajo o botón ("Silenciar animación") para prevenir distracciones visuales o fatiga cognitiva.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Media (Identidad interactiva y feedback visual de voz).
* **Estimación Sugerida (Story Points):** 3
* **Dependencias:** Ninguna.
* **Notas Técnicas Adicionales:**
  - Desarrollar el espectrograma usando `AudioContext` en el cliente.
  - Las barras o líneas del visualizador deben dibujarse en un elemento `<canvas>` o mediante un mapeo de elementos div HTML escalados dinámicamente con Tailwind, asegurando compatibilidad total en plataformas móviles (iOS Safari / Android Chrome).

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU10 feat: componente de espectrograma interactivo conectado al micrófono del usuario`).
