# 📐 Diagramas del Sistema - Clóset Digital (MVP)

Este directorio contiene los diagramas técnicos y flujos visuales que describen la arquitectura de la información, el ciclo de vida de los datos y las interacciones dentro del sistema. Todos los diagramas están escritos utilizando sintaxis **Mermaid.js**, lo cual permite renderizarlos directamente en visores compatibles con Markdown (como GitHub o editores integrados).

---

## 🗺️ Índice de Diagramas

### 1. **[Diagrama de Modelo de Datos / Entidad-Relación Enriquecido](modelo_datos.md)**
* **Propósito:** Detalla la estructura documental de MongoDB, los tipos de datos de Mongoose, esquemas de validación de Zod y las reglas jerárquicas obligatorias entre categorías y subcategorías de prendas.
* **Componentes clave:** Esquema de la colección `Prenda` y la estructura embebida 1:1 de `MetadataPrenda`.

### 2. **[Diagrama de Transición de Estados (Máquina de Estados)](transicion_estados.md)**
* **Propósito:** Modelar el ciclo de vida operativo de una prenda (`Disponible`, `Sucio`, `Lavandería`), detallando las acciones y triggers que provocan los cambios de estado, y la lógica de validación interna.
* **Componentes clave:** Estados visuales en UI (opacidad en galería) y ejemplos de Server Actions de transición.

### 3. **[Diagrama de Flujo de Navegación y Arquitectura de la Información](flujo_navegacion.md)**
* **Propósito:** Mostrar la estructura del enrutamiento de Next.js (App Router), la separación de responsabilidades entre componentes de servidor (RSC) y cliente (Client Components), y la interceptación de rutas para vistas de detalle sin pérdida de contexto.
* **Componentes clave:** Jerarquía de rutas (`/`, `/prendas/registrar`, `/prendas/[id]`, `/administracion`) e integración con Server Actions.

---

## 🎨 Renderizado de Mermaid
Si tu visor de Markdown no renderiza automáticamente los diagramas integrados, puedes usar herramientas como [Mermaid Live Editor](https://mermaid.live/) copiando y pegando el bloque de código correspondiente etiquetado con `mermaid`.
