# HU-8: API de Extracción de Metadatos Multimodal (OpenRouter / Gemini)

## 📝 Descripción (Formato Connextra)
* **Como** desarrollador del sistema de Clóset Digital,
* **Quiero** que el Route Handler `/api/prendas/analyze-image` inyecte dinámicamente las listas y enums válidos de categorías, subcategorías y estilos en el prompt de OpenRouter/Gemini,
* **Para** obligar a la IA a retornar exactamente la terminología compatible con nuestro sistema y evitar rechazos sintácticos durante la validación JSON.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Análisis e inferencia exitosa con mapeo estricto
* **Dado que** se envía una petición HTTP POST a `/api/prendas/analyze-image` con la imagen de una prenda,
* **Cuando** el servidor lee los diccionarios de categorías y subcategorías definidos en el código (ej. `CategoriasRelaciones`) y los concatena dinámicamente en las instrucciones del prompt de OpenRouter,
* **Entonces** Gemini procesa la imagen y devuelve un JSON estructurado mapeando los atributos únicamente a los términos válidos (ej: devuelve "Camiseta" en lugar de "T-Shirt" o "Remera"),
* **Y** el servicio responde con éxito (`200 OK`) entregando los metadatos listos para el cliente.

### Escenario 2: Prevención de fallos por cambios dinámicos en los enums
* **Dado que** los enums de diseño en el código cambian o se añaden nuevas subcategorías en el futuro,
* **Cuando** la API ejecuta el análisis visual de imagen,
* **Entonces** el prompt del sistema refleja instantáneamente los nuevos enums permitidos sin necesidad de editar manualmente el texto del prompt de la IA.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Dinamicidad:** Queda prohibido hardcodear las listas de categorías, subcategorías u ocasiones en el texto estático del prompt. Deben ser interpoladas programáticamente a partir de las constantes TypeScript de validación (`CategoriasRelaciones` y esquemas Zod).
* **Gateway IA:** Las llamadas a modelos multimodales deben canalizarse mediante **OpenRouter**, con el modelo `google/gemini-2.5-flash` o equivalente como prioridad por su alto rendimiento y bajo costo en tareas de visión.
* **Seguridad de API Keys:** La clave de OpenRouter (`OPENROUTER_API_KEY`) debe ser inyectada en tiempo de ejecución en el servidor y nunca quedar expuesta en el cliente.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Seguridad sintáctica y flexibilidad de enums).
* **Estimación Sugerida (Story Points):** 3
* **Dependencias:** HU-7 (Requiere los tipos y esquemas de metadatos actualizados).
* **Notas Técnicas Adicionales:**
  - En `/api/prendas/analyze-image/route.ts`, importar `CategoriasRelaciones` y usar `Object.entries(CategoriasRelaciones)` para construir una cadena explicativa que describa detalladamente las reglas cromáticas y estructurales de clasificación.
  - Asegurar la respuesta estructurada (`response_format: { type: "json_object" }`) o usar el SDK de Vercel AI (`generateObject`) suministrando el esquema tipado dinámicamente.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU8 feat: inyección dinámica de enums en el prompt de visión de Gemini via OpenRouter`).
