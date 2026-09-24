import { z } from 'zod';

export const categoriasValidas = ['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios'] as const;
export const estadosValidos = ['Disponible', 'Sucio', 'Lavandería'] as const;
export const coloresValidos = [
  'Negro', 'Blanco', 'Gris', 'Azul Marino', 'Azul Claro', 
  'Beige', 'Café', 'Verde Oliva', 'Burdeos', 'Rojo', 
  'Amarillo', 'Verde', 'Rosa'
] as const;
export const estacionesValidas = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año'] as const;
export const estilosValidos = ['Casual', 'Formal', 'Deportivo', 'Streetwear', 'Oficina', 'Fiesta'] as const;
export const impermeabilidadValida = ['Sin Proteccion', 'Repelente', 'Impermeable'] as const;
export const capaPosicionValida = ['Interior', 'Media', 'Exterior', 'Única'] as const;
export const rolCapsulaValido = ['Esencial Neutro', 'Pieza de Acento', 'Declaración'] as const;
export const ocasionesValidas = ['Trabajo', 'Deporte', 'Social', 'Formal', 'Hogar', 'Playa'] as const;

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
    notas: z.string().max(300, 'Las notas no pueden superar los 300 caracteres.').optional(),
    climaClo: z.number({
      invalid_type_error: 'El aislamiento térmico (climaClo) debe ser un número.'
    })
      .min(0.0, 'El aislamiento térmico (climaClo) no puede ser menor a 0.0.')
      .max(2.0, 'El aislamiento térmico (climaClo) no puede ser mayor a 2.0.')
      .optional()
      .nullable(),
    impermeabilidad: z.enum(impermeabilidadValida, {
      errorMap: () => ({ message: 'El nivel de impermeabilidad seleccionado no es válido.' })
    }).optional().nullable(),
    capaPosicion: z.enum(capaPosicionValida, {
      errorMap: () => ({ message: 'La capa de posición seleccionada no es válida.' })
    }).optional().nullable(),
    rolCapsula: z.enum(rolCapsulaValido, {
      errorMap: () => ({ message: 'El rol de armario cápsula seleccionado no es válido.' })
    }).optional().nullable(),
    ocasiones: z.array(z.enum(ocasionesValidas, {
      errorMap: () => ({ message: 'Una o más de las ocasiones seleccionadas no son válidas.' })
    })).optional().nullable(),
    texturaMaterial: z.string().optional().nullable()
  })
}).refine((data) => {
  const subcategoriasPermitidas = relacionCategoriaSubcategoria[data.metadata.categoria];
  return subcategoriasPermitidas?.includes(data.metadata.subcategoria);
}, {
  message: "La subcategoría no corresponde a la categoría principal seleccionada.",
  path: ["metadata", "subcategoria"]
});

export type PrendaInput = z.infer<typeof PrendaZodSchema>;
