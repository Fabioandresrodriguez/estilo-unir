# HU-13: Motor de Recomendación Híbrido en Dos Etapas (Pre-filtrado Lógico + Orquestador LLM)

## 📝 Descripción (Formato Connextra)
* **Como** desarrollador del Clóset Digital,
* **Quiero** implementar un servicio de recomendación en dos etapas simplificado que filtre lógicamente las prendas por disponibilidad y delegue a Google Gemini via OpenRouter la selección estilística y térmica adaptada al clima cualitativo (Frío, Templado, Cálido),
* **Para** proveer al usuario hasta 3 opciones de outfits completos sin sobrecomplicar la lógica con fórmulas matemáticas rígidas de aislamiento térmico.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Generación exitosa de outfits
* **Dado que** el usuario solicita una recomendación para un clima clasificado como "Frío" y ocasión "Trabajo",
* **Cuando** el motor de recomendación se ejecuta en el servidor,
* **Entonces** filtra el inventario buscando prendas con estado `Disponible` y categorías adecuadas (Superior, Inferior, Calzado),
* **Y** solicita a la IA (Gemini via OpenRouter) componer hasta 3 opciones de outfits completos aplicando la proporción de color 60-30-10 y la regla de capas de vestir,
* **Y** retorna al cliente las opciones con su respectiva justificación de estilo redactada por la IA.

### Escenario 2: Filtrado por probabilidad de lluvia
* **Dado que** el usuario reporta una probabilidad alta de lluvia en el contexto,
* **Cuando** la primera etapa de pre-filtrado lógico se ejecuta,
* **Entonces** prioriza la inclusión de prendas que tengan la propiedad de impermeabilidad clasificada como "Repelente" o "Impermeable" en su metadata (en caso de que cuenten con ella),
* **Y** le indica explícitamente a Gemini en el prompt que priorice calzado y abrigos resistentes al agua.

### Escenario 3: Manejo de inventario insuficiente (Sin opciones viables)
* **Dado que** el usuario tiene pocas prendas en estado `Disponible` (ej: todo su armario está en estado `Sucio` o `Lavandería`),
* **Cuando** el algoritmo intenta realizar el pre-filtrado lógico y no encuentra suficientes prendas básicas para estructurar al menos 2 combinaciones viables,
* **Entonces** el motor detiene la llamada a la IA de OpenRouter para prevenir cargos de API innecesarios y retorna un aviso indicando al usuario la necesidad de lavar prendas o registrar más ropa.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Regla Cromática 60-30-10:** El modelo de IA debe estructurar el conjunto asignando un color principal de base neutra (60%), un color complementario secundario (30%) y una pieza de acento (10%).
* **Regla de la Versatilidad (1:3):** El motor debe priorizar prendas que puedan combinarse en al menos 3 outfits diferentes, rotando los artículos para evitar la repetición constante del mismo conjunto.
* **Consistencia en Capas:** La IA debe validar el posicionamiento lógico de capas de ropa (Interior, Media, Exterior, Única), evitando colocar una capa interior sobre una exterior.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Motor central de recomendación e inteligencia de negocio).
* **Estimación Sugerida (Story Points):** 3
* **Dependencias:** HU-7 y HU-12 (Depende del esquema de prendas extendido y el modelo de Outfit).
* **Notas Técnicas Adicionales:**
  - Implementar la lógica del servicio en `lib/services/recomendador.ts`.
  - Utilizar el provider de OpenRouter con el modelo `google/gemini-2.5-flash` pasándole un prompt del sistema altamente estructurado con las reglas estéticas y el catálogo de las prendas disponibles.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU13 feat: desarrollo de motor de recomendación de outfits basado en Gemini simplificado`).
