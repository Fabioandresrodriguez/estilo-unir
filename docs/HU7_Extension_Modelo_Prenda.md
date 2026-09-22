# HU-7: Extensión del Modelo de Datos `Prenda` y Esquemas de Validación (Zod/Mongoose)

## 📝 Descripción (Formato Connextra)
* **Como** desarrollador del Clóset Digital,
* **Quiero** extender el modelo de datos de la colección `Prenda` en Mongoose y sus esquemas de validación asociados en Zod con campos opcionales,
* **Para** incorporar los metadatos físicos, estéticos y de posicionamiento térmico calculados por la Inteligencia Artificial sin forzar al usuario a tener que ingresarlos obligatoriamente al registrar prendas de forma manual.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Validación exitosa de una prenda sin metadatos extendidos (registro manual minimalista)
* **Dado que** se provee un objeto de prenda que contiene únicamente los metadatos básicos obligatorios (`categoria`, `subcategoria`, `colores`, `estaciones`, `estilo`, `talla`),
* **Cuando** el validador de Zod y Mongoose procesan el objeto,
* **Entonces** la validación es exitosa, ignorando la ausencia de los campos de metadatos de IA, y permite la persistencia sin errores de esquema.

### Escenario 2: Validación exitosa con metadatos extendidos opcionales (registro asistido por IA)
* **Dado que** se provee un objeto de prenda con todos los atributos de metadatos expandidos (`climaClo`, `impermeabilidad`, `ocasiones`, `capaPosicion`, `rolCapsula`, `texturaMaterial`),
* **Cuando** el validador procesa el objeto,
* **Entonces** valida la corrección de los tipos de datos opcionales y permite guardar la prenda con la información enriquecida en MongoDB.

### Escenario 3: Rechazo de campos extendidos con tipos incorrectos
* **Dado que** los metadatos extendidos son opcionales, pero si se proveen deben ser válidos,
* **Cuando** el valor de `climaClo` provisto es un tipo incorrecto (ej: un string en vez de un número) o está fuera del rango [0.0, 2.0],
* **Entonces** el validador de Zod detiene la operación y retorna un mensaje de error descriptivo en el campo correspondiente.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Opcionalidad Estricta:** Los nuevos campos (`climaClo`, `impermeabilidad`, `ocasiones`, `capaPosicion`, `rolCapsula`, `texturaMaterial`) no deben tener la restricción `required: true` en Mongoose ni en el esquema Zod, aceptando valores `undefined`, `null` u opcionales.
* **Formatos de Datos:** Si los campos opcionales están presentes, deben cumplir:
  - `climaClo`: número flotante entre `0.0` y `2.0`.
  - `impermeabilidad`: uno de `['Sin Proteccion', 'Repelente', 'Impermeable']`.
  - `capaPosicion`: uno de `['Interior', 'Media', 'Exterior', 'Única']`.
  - `rolCapsula`: uno de `['Esencial Neutro', 'Pieza de Acento', 'Declaración']`.
  - `ocasiones`: colección tipada de `['Trabajo', 'Deporte', 'Social', 'Formal', 'Hogar', 'Playa']`.
* **Accesibilidad (WCAG 2.2):** Los mensajes de error de validación en caso de ingresar formatos inválidos en los campos opcionales deben ser leídos por los asistentes de pantalla de manera estructurada e intuitiva.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Cimiento de base de datos e interoperabilidad).
* **Estimación Sugerida (Story Points):** 2
* **Dependencias:** Ninguna.
* **Notas Técnicas Adicionales:**
  - Modificar `lib/models/Prenda.ts` y añadir las nuevas propiedades con `required: false` (o simplemente omitiendo la bandera required de Mongoose).
  - En Zod, definir los nuevos campos como `.optional()` o `.nullable()`.
  - El campo `subcategoria` debe seguir validándose en relación con la `categoria` provista.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU7 feat: soporte de metadatos opcionales de IA en esquemas Zod y Mongoose`).
