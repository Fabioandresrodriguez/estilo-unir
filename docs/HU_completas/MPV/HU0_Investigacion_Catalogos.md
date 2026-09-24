# HU0: Investigación de Catálogos y Modelo de Datos

## 1. Identificador y Título
* **ID:** HU0
* **Título:** Investigación de Catálogos y Modelo de Datos

---

## 2. Historia de Usuario
**Como** Administrador del sistema y desarrollador,  
**Quiero** definir y normalizar la estructura de datos de las prendas y sus catálogos,  
**Para** garantizar la integridad, consistencia y extensibilidad del inventario del clóset, evitando la fragmentación de datos y habilitando filtros avanzados.

---

## 3. Criterios de Aceptación Funcionales
- [ ] **Estructura Jerárquica Obligatoria:** Cada prenda debe clasificarse en una Categoría principal y una Subcategoría correspondiente. Si la categoría no coincide con las subcategorías permitidas, la validación debe fallar.
- [ ] **Catálogo de Colores Normalizado:** Las prendas deben registrar colores pertenecientes a una paleta base predefinida para evitar variantes tipográficas (ej. "azul oscuro", "azul marino", "azulito").
- [ ] **Temporalidad y Clima:** Se debe permitir la asignación de una o más estaciones del año (Primavera, Verano, Otoño, Invierno, Todo el año).
- [ ] **Ocasión y Estilo:** Se deben soportar múltiples etiquetas de estilo (Casual, Formal, Deportivo, Streetwear, Oficina, Fiesta).
- [ ] **Ciclo de Vida de Estado:** Las prendas deben iniciar por defecto en el estado **Disponible**. Los estados permitidos son exactamente: `Disponible`, `Sucio` y `Lavandería`.
- [ ] **Script de Inicialización (Seed):** Debe proveerse un script ejecutable que limpie la base de datos de MongoDB e inserte al menos 20 prendas con combinaciones de datos realistas e imágenes de prueba consistentes.

---

## 4. Especificación Técnica y Arquitectura

### A. Componentes UI Relacionados
*Dado que HU0 define la base de datos, los componentes de UI que consumirán esta estructura en los formularios (HU1) y filtros (HU2, HU4) son:*
* **Select (shadcn/ui):** Para selección unívoca de Categoría, Subcategoría y Talla.
* **Badge (shadcn/ui):** Para representar visualmente los colores, estilos y estaciones de forma compacta.
* **Multi-select / Checkbox (shadcn/ui):** Para la selección múltiple de Colores, Estaciones y Estilo en formularios.

### B. Estructuras de Datos

#### 1. TypeScript Interfaces (`@/types/prenda.ts`)
```typescript
export type EstadoPrenda = 'Disponible' | 'Sucio' | 'Lavandería';

export type CategoriaPrenda = 'Superior' | 'Inferior' | 'Entero' | 'Calzado' | 'Accesorios';

export type SubcategoriaPrenda = 
  // Superior
  | 'Camiseta' | 'Camisa' | 'Hoodie' | 'Chamarra' | 'Suéter' | 'Top'
  // Inferior
  | 'Jeans' | 'Pantalón' | 'Shorts' | 'Cargo' | 'Joggers' | 'Falda'
  // Entero
  | 'Vestido' | 'Mono' | 'Overol'
  // Calzado
  | 'Sneakers' | 'Botas' | 'Zapatos Formales' | 'Sandalias'
  // Accesorios
  | 'Gorra' | 'Bufanda' | 'Cinturón' | 'Lentes' | 'Mochila' | 'Bolso';

export type ColorBase = 
  | 'Negro' | 'Blanco' | 'Gris' | 'Azul Marino' | 'Azul Claro' 
  | 'Beige' | 'Café' | 'Verde Oliva' | 'Burdeos' | 'Rojo' 
  | 'Amarillo' | 'Verde' | 'Rosa';

export type EstacionClima = 'Primavera' | 'Verano' | 'Otoño' | 'Invierno' | 'Todo el año';

export type EstiloPrenda = 'Casual' | 'Formal' | 'Deportivo' | 'Streetwear' | 'Oficina' | 'Fiesta';

export interface IMetadataPrenda {
  categoria: CategoriaPrenda;
  subcategoria: SubcategoriaPrenda;
  colores: ColorBase[];
  estaciones: EstacionClima[];
  estilo: EstiloPrenda[];
  talla: string;
  notas?: string;
}

export interface IPrenda {
  _id?: string;
  nombre: string;
  imagenes: string[];
  estado: EstadoPrenda;
  metadata: IMetadataPrenda;
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### 2. Esquema Mongoose (`@/lib/models/Prenda.ts`)
```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IPrenda } from '@/types/prenda';

export interface IPrendaDocument extends Omit<IPrenda, '_id'>, Document {}

const MetadatosSchema = new Schema({
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria.'],
    enum: ['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios']
  },
  subcategoria: {
    type: String,
    required: [true, 'La subcategoría es obligatoria.'],
    validate: {
      validator: function(this: any, val: string) {
        const relaciones: Record<string, string[]> = {
          'Superior': ['Camiseta', 'Camisa', 'Hoodie', 'Chamarra', 'Suéter', 'Top'],
          'Inferior': ['Jeans', 'Pantalón', 'Shorts', 'Cargo', 'Joggers', 'Falda'],
          'Entero': ['Vestido', 'Mono', 'Overol'],
          'Calzado': ['Sneakers', 'Botas', 'Zapatos Formales', 'Sandalias'],
          'Accesorios': ['Gorra', 'Bufanda', 'Cinturón', 'Lentes', 'Mochila', 'Bolso']
        };
        const cat = this.categoria || this.parent().metadata.categoria;
        return relaciones[cat]?.includes(val) ?? false;
      },
      message: 'La subcategoría no corresponde a la categoría seleccionada.'
    }
  },
  colores: {
    type: [String],
    required: [true, 'Debe ingresar al menos un color.'],
    validate: {
      validator: (val: string[]) => val.length > 0,
      message: 'Debe especificar al menos un color.'
    }
  },
  estaciones: {
    type: [String],
    required: [true, 'Debe ingresar al menos una estación.'],
    validate: {
      validator: (val: string[]) => val.length > 0,
      message: 'Debe especificar al menos una estación.'
    }
  },
  estilo: {
    type: [String],
    required: [true, 'Debe especificar al menos un estilo.'],
    validate: {
      validator: (val: string[]) => val.length > 0,
      message: 'Debe especificar al menos un estilo.'
    }
  },
  talla: {
    type: String,
    required: [true, 'La talla es obligatoria.'],
    trim: true
  },
  notas: {
    type: String,
    required: false,
    trim: true,
    maxlength: [300, 'Las notas no pueden superar los 300 caracteres.']
  }
}, { _id: false });

const PrendaSchema = new Schema<IPrendaDocument>({
  nombre: {
    type: String,
    required: [true, 'El nombre de la prenda es obligatorio.'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres.'],
    maxlength: [80, 'El nombre no puede superar los 80 caracteres.']
  },
  imagenes: {
    type: [String],
    required: [true, 'Debe subir al menos una imagen de la prenda.'],
    validate: {
      validator: (val: string[]) => val.length > 0,
      message: 'Debe haber al menos una imagen asociada.'
    }
  },
  estado: {
    type: String,
    required: true,
    enum: ['Disponible', 'Sucio', 'Lavandería'],
    default: 'Disponible'
  },
  metadata: {
    type: MetadatosSchema,
    required: true
  }
}, {
  timestamps: true
});

// Evitar la compilación múltiple del modelo en Next.js por recarga rápida (HMR)
const Prenda: Model<IPrendaDocument> = mongoose.models.Prenda || mongoose.model<IPrendaDocument>('Prenda', PrendaSchema);
export default Prenda;
```

#### 3. Esquema de Validación Zod (`@/lib/validations/prenda.ts`)
```typescript
import { z } from 'zod';

const categoriasValidas = ['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios'] as const;
const estadosValidos = ['Disponible', 'Sucio', 'Lavandería'] as const;
const coloresValidos = [
  'Negro', 'Blanco', 'Gris', 'Azul Marino', 'Azul Claro', 
  'Beige', 'Café', 'Verde Oliva', 'Burdeos', 'Rojo', 
  'Amarillo', 'Verde', 'Rosa'
] as const;
const estacionesValidas = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año'] as const;
const estilosValidos = ['Casual', 'Formal', 'Deportivo', 'Streetwear', 'Oficina', 'Fiesta'] as const;

export const relacionCategoriaSubcategoria: Record<string, string[]> = {
  Superior: ['Camiseta', 'Camisa', 'Hoodie', 'Chamarra', 'Suéter', 'Top'],
  Inferior: ['Jeans', 'Pantalón', 'Shorts', 'Cargo', 'Joggers', 'Falda'],
  Entero: ['Vestido', 'Mono', 'Overol'],
  Calzado: ['Sneakers', 'Botas', 'Zapatos Formales', 'Sandalias'],
  Accesorios: ['Gorra', 'Bufanda', 'Cinturón', 'Lentes', 'Mochila', 'Bolso']
};

export const PrendaZodSchema = z.object({
  nombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(80, 'El nombre no puede superar los 80 caracteres.')
    .trim(),
  imagenes: z.array(z.string().url('Cada imagen debe ser una URL válida.'))
    .min(1, 'Debe subir al menos una imagen.'),
  estado: z.enum(estadosValidos).default('Disponible'),
  metadata: z.object({
    categoria: z.enum(categoriasValidas, {
      errorMap: () => ({ message: 'Categoría no válida.' })
    }),
    subcategoria: z.string().min(1, 'La subcategoría es obligatoria.'),
    colores: z.array(z.enum(coloresValidos))
      .min(1, 'Debe seleccionar al menos un color.'),
    estaciones: z.array(z.enum(estacionesValidas))
      .min(1, 'Debe seleccionar al menos una estación.'),
    estilo: z.array(z.enum(estilosValidos))
      .min(1, 'Debe seleccionar al menos un estilo.'),
    talla: z.string().min(1, 'La talla es obligatoria.').trim(),
    notas: z.string().max(300, 'Las notas no pueden superar los 300 caracteres.').optional()
  })
}).refine((data) => {
  const subcategoriasPermitidas = relacionCategoriaSubcategoria[data.metadata.categoria];
  return subcategoriasPermitidas?.includes(data.metadata.subcategoria);
}, {
  message: "La subcategoría no corresponde a la categoría principal seleccionada.",
  path: ["metadata", "subcategoria"]
});

export type PrendaInput = z.infer<typeof PrendaZodSchema>;
```

### C. Rutas API
*Para la inicialización y validación, no se crean endpoints específicos de catálogo dinámico ya que son constantes tipadas en código, pero se describe el endpoint de Healthcheck de la base de datos y la ruta del seed.*

#### `GET /api/db-check`
* **Método:** `GET`
* **Descripción:** Comprueba la conexión activa con MongoDB.
* **Respuesta de éxito (200 OK):**
  ```json
  {
    "status": "connected",
    "database": "closet_digital_mvp",
    "timestamp": "2026-06-13T19:26:00.000Z"
  }
  ```
* **Respuesta de error (500 Internal Server Error):**
  ```json
  {
    "status": "disconnected",
    "error": "Timeout connecting to MongoDB server"
  }
  ```

---

## 5. Especificación UX/UI

### Catálogos y Normalización
1. **Presentación de Colores:** Los colores en la interfaz no solo deben mostrarse como texto, sino acompañados de un círculo de color real (`bg-black`, `bg-neutral-200`, `bg-blue-900`, etc.) para agilizar el reconocimiento visual.
2. **Jerarquía Visual de Selección:** Al registrar (HU1) o filtrar (HU2), si el usuario selecciona la categoría "Superior", las opciones de subcategoría deben actualizarse de inmediato en la UI aplicando transiciones de desvanecimiento suave (`transition-opacity duration-200`).
3. **Accesibilidad (a11y):**
   * Los círculos de colores deben tener un borde visible en caso de fondos claros/oscuros (`border border-input`) y contar con un atributo `aria-label` que exprese el color (ej. `aria-label="Color Negro"`).
   * Contraste mínimo de 4.5:1 en todos los textos de badges.

---

## 6. Script de Inicialización (Seed) Detallado (`@/scripts/seed.ts`)

Este script se ejecuta mediante `npx tsx scripts/seed.ts` para restablecer el entorno de desarrollo.

```typescript
import mongoose from 'mongoose';
import Prenda from '../lib/models/Prenda';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/closet_digital';

const prendasDePrueba = [
  {
    nombre: 'Hoodie Oversized Negro',
    imagenes: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Hoodie',
      colores: ['Negro'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Streetwear', 'Casual'],
      talla: 'L',
      notas: 'Algodón pesado, lavar al revés para cuidar el color.'
    }
  },
  {
    nombre: 'Camiseta Básica de Algodón Blanca',
    imagenes: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Camiseta',
      colores: ['Blanco'],
      estaciones: ['Primavera', 'Verano', 'Todo el año'],
      estilo: ['Casual', 'Streetwear'],
      talla: 'M',
      notas: 'Corte regular, básica para capas.'
    }
  },
  {
    nombre: 'Jeans Denim Recto Azul Claro',
    imagenes: ['https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600'],
    estado: 'Sucio',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Jeans',
      colores: ['Azul Claro'],
      estaciones: ['Primavera', 'Otoño', 'Todo el año'],
      estilo: ['Casual', 'Streetwear'],
      talla: '32',
      notas: 'Mezclilla rígida sin elastano.'
    }
  },
  {
    nombre: 'Cargo Pants Verde Oliva',
    imagenes: ['https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=600'],
    estado: 'Lavandería',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Cargo',
      colores: ['Verde Oliva'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Streetwear', 'Deportivo'],
      talla: '30',
      notas: 'Bolsillos laterales espaciosos.'
    }
  },
  {
    nombre: 'Sneakers Retro Blancos',
    imagenes: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Calzado',
      subcategoria: 'Sneakers',
      colores: ['Blanco', 'Gris'],
      estaciones: ['Todo el año'],
      estilo: ['Casual', 'Streetwear', 'Deportivo'],
      talla: '42',
      notas: 'Limpiar suela después de usar en días lluviosos.'
    }
  },
  {
    nombre: 'Chamarra de Cuero Negra Biker',
    imagenes: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Chamarra',
      colores: ['Negro'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Streetwear', 'Casual', 'Fiesta'],
      talla: 'M',
      notas: 'Cuero genuino, no exponer al agua directa.'
    }
  },
  {
    nombre: 'Pantalón Chino Beige',
    imagenes: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Pantalón',
      colores: ['Beige'],
      estaciones: ['Primavera', 'Verano', 'Oficina'],
      estilo: ['Formal', 'Casual', 'Oficina'],
      talla: '32',
      notas: 'Tela delgada y elástica.'
    }
  },
  {
    nombre: 'Camisa Formal Slim Fit Azul Marino',
    imagenes: ['https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600'],
    estado: 'Sucio',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Camisa',
      colores: ['Azul Marino'],
      estaciones: ['Todo el año'],
      estilo: ['Formal', 'Oficina'],
      talla: 'M',
      notas: 'Requiere planchado a vapor.'
    }
  },
  {
    nombre: 'Botas de Piel Café',
    imagenes: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Calzado',
      subcategoria: 'Botas',
      colores: ['Café'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Formal', 'Casual'],
      talla: '43',
      notas: 'Hidratar la piel cada tres meses.'
    }
  },
  {
    nombre: 'Shorts Deportivos Negros',
    imagenes: ['https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Shorts',
      colores: ['Negro'],
      estaciones: ['Verano'],
      estilo: ['Deportivo'],
      talla: 'M',
      notas: 'Material transpirable, secado rápido.'
    }
  },
  {
    nombre: 'Suéter de Lana Burdeos',
    imagenes: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Suéter',
      colores: ['Burdeos'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Casual', 'Formal', 'Oficina'],
      talla: 'L',
      notas: 'Lavar únicamente a mano con agua fría.'
    }
  },
  {
    nombre: 'Vestido Midi Rojo',
    imagenes: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Entero',
      subcategoria: 'Vestido',
      colores: ['Rojo'],
      estaciones: ['Primavera', 'Verano'],
      estilo: ['Formal', 'Fiesta'],
      talla: 'S',
      notas: 'Vestido de fiesta elegante.'
    }
  },
  {
    nombre: 'Joggers Básicos Grises',
    imagenes: ['https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=600'],
    estado: 'Sucio',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Joggers',
      colores: ['Gris'],
      estaciones: ['Otoño', 'Invierno', 'Todo el año'],
      estilo: ['Casual', 'Deportivo', 'Streetwear'],
      talla: 'M',
      notas: 'Algodón frisado súper cómodo.'
    }
  },
  {
    nombre: 'Gorra de Gabardina Negra',
    imagenes: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Gorra',
      colores: ['Negro'],
      estaciones: ['Primavera', 'Verano', 'Todo el año'],
      estilo: ['Casual', 'Streetwear', 'Deportivo'],
      talla: 'Ajustable',
      notas: 'Visera curva clásica.'
    }
  },
  {
    nombre: 'Overol de Mezclilla Azul Marino',
    imagenes: ['https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Entero',
      subcategoria: 'Overol',
      colores: ['Azul Marino'],
      estaciones: ['Primavera', 'Otoño'],
      estilo: ['Casual', 'Streetwear'],
      talla: 'M',
      notas: 'Estilo vintage clásico.'
    }
  },
  {
    nombre: 'Bufanda Tejida Gris Oscuro',
    imagenes: ['https://images.unsplash.com/photo-1520903928273-0f44b2a2eed5?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Bufanda',
      colores: ['Gris'],
      estaciones: ['Invierno'],
      estilo: ['Casual', 'Formal'],
      talla: 'Única',
      notas: 'Lana acrílica suave.'
    }
  },
  {
    nombre: 'Cinturón de Piel Negro',
    imagenes: ['https://images.unsplash.com/photo-1624222247344-550fb8ecf7db?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Cinturón',
      colores: ['Negro'],
      estaciones: ['Todo el año'],
      estilo: ['Formal', 'Oficina', 'Casual'],
      talla: '34',
      notas: 'Hebilla plateada satinada.'
    }
  },
  {
    nombre: 'Sandalias de Cuero Beige',
    imagenes: ['https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Calzado',
      subcategoria: 'Sandalias',
      colores: ['Beige'],
      estaciones: ['Verano'],
      estilo: ['Casual'],
      talla: '41',
      notas: 'Suela de corcho anatómica.'
    }
  },
  {
    nombre: 'Lentes de Sol Retro Negros',
    imagenes: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Lentes',
      colores: ['Negro'],
      estaciones: ['Primavera', 'Verano', 'Todo el año'],
      estilo: ['Streetwear', 'Casual', 'Fiesta'],
      talla: 'Única',
      notas: 'Protección UV400.'
    }
  },
  {
    nombre: 'Mochila de Lona Impermeable Gris',
    imagenes: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Mochila',
      colores: ['Gris'],
      estaciones: ['Todo el año'],
      estilo: ['Casual', 'Deportivo', 'Oficina'],
      talla: '20L',
      notas: 'Compartimento acolchado para laptop de 15 pulgadas.'
    }
  }
];

async function seed() {
  try {
    console.log('⏳ Conectando a MongoDB para inicialización de datos...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión establecida.');

    console.log('🧹 Limpiando colección de prendas...');
    const deleteResult = await Prenda.deleteMany({});
    console.log(`🗑️ Se eliminaron ${deleteResult.deletedCount} prendas anteriores.`);

    console.log('🌱 Insertando datos de catálogo iniciales (20 prendas de prueba)...');
    const creadas = await Prenda.insertMany(prendasDePrueba);
    console.log(`🎉 Seed completado con éxito. Se insertaron ${creadas.length} prendas.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar el script de seed:', error);
    process.exit(1);
  }
}

seed();
```

---

## 7. Casos de Prueba y QA

### Escenario 1: Creación Exitosa (Happy Path)
* **Entrada:** Objeto de prenda con nombre "Chamarra Vaquera", categoría "Superior", subcategoría "Chamarra", color "Azul Claro", estación "Otoño", estilo "Casual", talla "M", y 1 URL de imagen.
* **Proceso:** Validación Zod aprobada, pasa la validación interna de Mongoose (la subcategoría pertenece a "Superior") e inserta el registro en base de datos.
* **Resultado:** HTTP 201 y el documento tiene el campo `estado` por defecto establecido en `'Disponible'`.

### Escenario 2: Error por Inconsistencia de Jerarquía (Edge Case)
* **Entrada:** Objeto de prenda con categoría "Superior" y subcategoría "Jeans" (que pertenece a la categoría "Inferior").
* **Proceso:** El validador de Zod `.refine` rechaza la estructura devolviendo un error de validación descriptivo antes de golpear la base de datos. Si se esquivara Zod por alguna razón, el validador `validate` de Mongoose en la propiedad `subcategoria` detendría la inserción y lanzaría un error.
* **Resultado:** Error de validación HTTP 400 especificando: `"La subcategoría no corresponde a la categoría principal seleccionada."`
