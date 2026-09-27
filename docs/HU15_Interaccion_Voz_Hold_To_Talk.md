# HU-15: Interacción de Voz Inmersiva "Hold-to-Talk" y Optimización UI/UX del Recomendador

## 📝 Descripción (Formato Connextra)
* **Como** usuario del Clóset Digital,
* **Quiero** interactuar con el asistente de voz mediante un control del tipo "Mantén presionado para hablar" (Hold-to-Talk),
* **Para** tener el control absoluto de cuándo inicia y finaliza la captura de mi voz, eliminando interrupciones prematuras del navegador y priorizando visualmente la experiencia manos libres sobre la entrada manual.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Captura de voz mediante interacción "Hold-to-Talk"
* **Dado que** el usuario se encuentra en la pantalla de recomendación de hoy,
* **Cuando** mantiene presionado el botón central de voz (mediante `onMouseDown` en desktop o `onTouchStart` en móviles),
* **Entonces** se activa el micrófono, el espectrograma cambia a modo activo ("LISTENING") y se inicia la transcripción en tiempo real de forma ininterrumpida sin importar las pausas de respiración,
* **Y** al soltar el botón (mediante `onMouseUp` / `onTouchEnd` / `onMouseLeave`), se detiene la grabación, finaliza la transcripción y se procesa automáticamente la recomendación.

### Escenario 2: Rediseño de UI/UX con Fallbacks Secundarios
* **Dado que** el usuario carga la pantalla del recomendador de hoy,
* **Cuando** se visualiza el layout neobrutalista,
* **Entonces** el botón central circular de voz ("Hold-to-Talk") y el espectrograma animado acaparan el protagonismo visual en el centro del viewport,
* **Y** la entrada manual (caja de texto y chips de fallback) se desplaza a una sección colapsable secundaria (acordeón o panel de "Ajustes Manuales") de menor jerarquía visual para no distraer.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Eventos Duales:** Para garantizar compatibilidad universal, el botón Hold-to-Talk debe implementar eventos de ratón (`onMouseDown`, `onMouseUp`, `onMouseLeave`) y de pantalla táctil (`onTouchStart`, `onTouchEnd`).
* **Auto-envío Inteligente:** Al soltar el control de voz, si el texto recopilado supera los 3 caracteres, se debe disparar la llamada al recomendador de forma automática para evitar clics adicionales.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Mejora radical del core conversacional).
* **Dependencias:** HU-11 y HU-13 (Requiere el motor de voz y el motor de recomendación híbrido).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU15 feat: implementación de botón Hold-to-Talk y rediseño UI/UX de fallback manual`).
