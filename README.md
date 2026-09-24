Aquí tienes el **Documento de Contexto y Especificación Técnica** para el desarrollo del MVP de tu aplicación de gestión de clóset. Este texto condensa los requerimientos, las reglas de negocio y el stack tecnológico elegido para que sirva como la "fuente de verdad" del proyecto antes de iniciar el código.
# Documento de Contexto: Clóset Digital (MVP)
## 1. Visión del Proyecto
El objetivo es desarrollar una aplicación web de nicho (estilo *Fits*) enfocada en la organización, digitalización y control de inventario de un guardarropa personal. El MVP (Producto Mínimo Viable) se centrará en resolver la fricción de "no saber qué ponerse" mediante un registro fotográfico enriquecido con metadatos exhaustivos y un control dinámico de disponibilidad basado en el estado de limpieza de las prendas.
## 2. Stack Tecnológico Seleccionado
Para garantizar un desarrollo ágil, un rendimiento óptimo en renderizado y una estética visual limpia y minimalista, se utilizarán las siguientes tecnologías:
 * **Framework:** **Next.js (App Router)**. Permite un renderizado híbrido (SSR para vistas estructuradas, CSR para la interactividad de la cámara/galería) y manejo nativo de rutas de API para interactuar con la base de datos.
 * **Base de Datos:** **MongoDB**. Su estructura documental (NoSQL) es ideal para manejar el esquema flexible de una Prenda, permitiendo múltiples fotos y arreglos de categorías/etiquetas sin la rigidez de las migraciones relacionales complejas.
 * **Estilos y Diseño:** **Tailwind CSS**. Para un desarrollo de interfaces rápido y utilitario, facilitando un diseño responsivo y adaptado a dispositivos móviles.
 * **Componentes de UI:** **shadcn/ui**. Librería basada en Radix Primitives y Tailwind. Aporta componentes accesibles, altamente personalizables y con una estética limpia, sobria y profesional (ideal para emular interfaces de aplicaciones modernas de *streetwear* o e-commerce premium).
## 3. Arquitectura de Datos y Catálogos (Core del MVP)
La prioridad absoluta del sistema es la **riqueza de su metadata**. Para evitar la fragmentación de datos y permitir filtros avanzados en el futuro, se implementará un sistema de catálogos estandarizados desde el inicio.
### Esquema Conceptual de la Entidad Prenda
Cada documento en la colección de MongoDB tendrá la siguiente estructura base:
```json
{
  "_id": "ObjectId",
  "nombre": "String", 
  "imagenes": ["String"], // URLs de almacenamiento (Cloudinary, S3, etc.)
  "estado": "String", // [Disponible, Sucio, Lavandería]
  "metadata": {
    "categoria": "String", // Superior, Inferior, Calzado, etc.
    "subcategoria": "String", // Hoodie, Camiseta, Pantalón, etc.
    "colores": ["String"], // Principal y secundarios
    "estaciones": ["String"], // Primavera, Verano, Otoño, Invierno, Todo el año
    "estilo": ["String"], // Casual, Formal, Deportivo, Streetwear
    "talla": "String", // S, M, L, 32, 42, etc.
    "notas": "String" // Detalles opcionales del usuario
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}

```
### Catálogos de Clasificación (HU0 de Investigación)
 * **Categorías y Subcategorías:** Árbol jerárquico básico (ej. *Superior* despliega *Camisa, Camiseta, Hoodie, Chamarra, Suéter*; *Inferior* despliega *Jeans, Shorts, Cargo, Joggers*).
 * **Paleta de Colores:** Listado normalizado de colores base para evitar duplicados (ej. "Negro", "Blanco", "Gris", "Azul Marino").
 * **Temporalidad / Clima:** Clasificación por estaciones del año o idoneidad climática.
 * **Ocasión / Estilo:** Etiquetas de uso diario (Casual, Formal, Deportivo, Oficina).
## 4. Alcance del MVP (Flujos de Pantallas)
El sistema se compone de tres flujos principales enfocados exclusivamente en la utilidad inmediata:
### A. Registro y Captura (Entrada de Datos)
 * **Interfaz:** Formulario limpio utilizando componentes de shadcn/ui (Card, Select, Input, Button).
 * **Manejo de Imágenes:** Soporte para cargar una o múltiples fotografías por prenda (desde archivos locales o captura de cámara en móvil).
 * **Flujo:** El usuario sube las fotos, selecciona los tags obligatorios de los catálogos y guarda. El estado inicial por defecto siempre es **Disponible**.
### B. Galería y Detalle (Visualización)
 * **Listado Principal:** Una cuadrícula (Grid) responsiva optimizada con Tailwind. Muestra las prendas en tarjetas visuales limpias.
   * *Regla de Negocio:* Las prendas cuyo estado sea **Sucio** o **En Lavandería** se renderizarán con una opacidad reducida o un indicador visual claro, denotando que no están disponibles para armar un outfit.
 * **Vista de Detalle:** Un modal o vista extendida (shadcn/ui Dialog o página dinámica) que muestra el carrusel de fotos en alta resolución y desglosa de manera ordenada toda la metadata de la prenda mediante *badges* o etiquetas visuales.
### C. Consola de Administración (Flujo de Ropa Sucia)
 * **Propósito:** Actuar como el interruptor operativo del clóset.
 * **Funcionamiento:** Una pantalla dividida en dos secciones o pestañas dinámicas:
   1. **Ropa Activa / Disponible:** Lista rápida para marcar qué prendas se usaron hoy y pasarlas instantáneamente al estado **Sucio**.
   2. **Ropa Sucia / Lavandería:** Inventario de todo lo que está fuera de circulación. Cuenta con una acción masiva o individual de "Marcar como Limpio" para regresar las prendas al estado **Disponible** de un solo clic.
## 5. Criterios de Éxito para el Despliegue Iterativo
 1. **Consistencia de Datos:** No se pueden introducir prendas sin categorías o subcategorías válidas (validación estricta en API con Zod/Mongoose).
 2. **Fluidez UI:** La interfaz debe ser minimalista, priorizando el contenido visual (las fotos de las prendas) sobre bordes o decoraciones excesivas.
 3. **Estado en Tiempo Real:** El cambio de estado en la pantalla de administración debe impactar de inmediato el comportamiento visual de la galería principal.

