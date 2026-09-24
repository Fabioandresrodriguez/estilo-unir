# HU-12: Modelo de Datos y Persistencia de Outfits Seleccionados

## 📝 Descripción (Formato Connextra)
* **Como** analista de datos del Clóset Digital,
* **Quiero** definir y persistir un modelo de datos `Outfit` simplificado en MongoDB mediante Mongoose,
* **Para** almacenar el registro histórico de los conjuntos elegidos por el usuario, sus prendas constitutivas, las variables de contexto de ese día y las notas explicativas del asistente de IA.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Creación y guardado exitoso de un Outfit en base de datos
* **Dado que** el usuario ha elegido un conjunto sugerido compuesto por 3 prendas (camisa, pantalón, tenis),
* **Cuando** se invoca la acción de guardado del outfit,
* **Entonces** se crea un nuevo documento en la colección `Outfits` de MongoDB que contiene la fecha actual, las referencias (`ObjectId`) de las 3 prendas, la temperatura ambiente (`15°C`), el tipo de ocasión (`Trabajo`) y el texto de justificación generado por la IA,
* **Y** retorna un identificador único de base de datos para confirmar el guardado.

### Escenario 2: Intento de guardar un Outfit sin prendas asociadas
* **Dado que** se intenta guardar un documento de Outfit con un arreglo de prendas vacío,
* **Cuando** Mongoose ejecuta la validación del esquema en el servidor,
* **Entonces** la validación falla arrojando un error de tipo de datos ("Debe incluir al menos 2 prendas para formar un outfit completo"),
* **Y** cancela la inserción en la base de datos de forma segura.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Relacionalidad:** El arreglo de prendas debe contener referencias válidas de tipo `Schema.Types.ObjectId` que apunten a documentos existentes en la colección `Prenda`.
* **Esquema Mínimo Requerido:** Cada registro de Outfit debe contener obligatoriamente:
  - `fecha`: tipo Date (autogenerado con `default: Date.now`).
  - `prendas`: array de ObjectIds (mínimo 2, máximo 5 prendas).
  - `contexto`: objeto que contenga `temperatura` (number), `lluvia` (number/boolean) y `ocasion` (string).
  - `justificacionEstilo`: string.
* **Integridad:** La eliminación de una `Prenda` del sistema debe manejar de forma controlada la existencia de registros históricos en la colección de `Outfits`.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Soporta el guardado del historial y cambio de estado de prendas).
* **Estimación Sugerida (Story Points):** 2
* **Dependencias:** HU-7 (Requiere consistencia con el modelo de Prenda).
* **Notas Técnicas Adicionales:**
  - Crear el modelo de datos en `lib/models/Outfit.ts`.
  - Definir las interfaces de TypeScript correspondientes en `types/outfit.ts`.
  - Incluir campos de auditoría como `createdAt` y `updatedAt` mediante las opciones de Mongoose `{ timestamps: true }`.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU12 feat: creación del modelo de datos Outfit y definición de tipos en Mongoose`).
