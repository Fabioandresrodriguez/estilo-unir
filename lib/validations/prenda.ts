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
    .min(1, 'Debe subir al menos una imagen.')
    .max(4, 'Límite máximo de 4 fotografías alcanzado.'),
  estado: z.enum(estadosValidos),
  metadata: z.object({
    categoria: z.enum(categoriasValidas),
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
