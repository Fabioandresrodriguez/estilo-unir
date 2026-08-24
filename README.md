# Estilo app: Auto-etiquetado Multimodal y Recomendador Inteligente de Outfits

Sistema web de gestión inteligente de guardarropa que reduce la fricción de digitalización mediante auto-etiquetado multimodal asistido por IA (extracción de 14 atributos semánticos por prenda) y ofrece un recomendador contextual de conjuntos sensible al clima, ocasión y estado físico del inventario.

---

## Características Principales

* **Auto-etiquetado Multimodal Zero-Shot:** Inferencia automática de 14 atributos semánticos (categoría, subcategoría, color, estilo, aislamiento térmico Clo, ocasión, material, entre otros) a partir de una única fotografía.
* **Extracción Estructurada y Tipada:** Decodificación guiada con esquemas validados para prevenir alucinaciones e inconsistencias de datos.
* **Inventario con Estado Transaccional:** Control dinámico de disponibilidad física (*Disponible*, *Sucio*, *Lavandería*) para evitar recomendaciones impracticables.
* **Recomendador Híbrido en Dos Etapas:**
  1. *Fase determinista:* Filtrado lógico por disponibilidad y reglas climáticas en base de datos.
  2. *Fase generativa:* Orquestación estilística mediante LLM basada en principios de armario cápsula.
* **Interacción por Voz:** Soporte nativo para comandos e interacciones fluidas mediante Web Speech API.

---

## Stack Tecnológico

| Capa                           | Tecnologías                                                           |
| :----------------------------- | :--------------------------------------------------------------------- |
| **Frontend & Framework** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4         |
| **Almacenamiento & BD**  | MongoDB Atlas, Mongoose, AWS S3 (imágenes)                            |
| **IA & Orquestación**   | Gemini 2.5 Flash (vía OpenRouter), Vercel AI SDK (`generateObject`) |
| **Validación de Datos** | Zod                                                                    |
| **APIs Nativas**         | Web Speech API                                                         |

---

## Arquitectura de Recomendación

```text
[ Foto de la Prenda ]
         │
         ▼
[ Gemini 2.5 Flash + Zod ] ──► (Extracción de 14 atributos JSON tipados)
         │
         ▼
[ MongoDB Atlas ] ◄────────── (Gestión de estados: Disponible / Sucio / Lavandería)
         │
         ├──► Etapa 1: Pre-filtrado lógico (Clima + Disponibilidad física)
         │
         └──► Etapa 2: Orquestación generativa LLM (Reglas de estilo y ocasión)
                                    │
                                    ▼
                         [ Outfits Personalizados ]
```
