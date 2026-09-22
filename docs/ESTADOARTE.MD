Sistema de Catalogación Multimodal y Recomendación de Moda Contextual: Arquitectura de Software, Extracción Estructurada con IA y Algoritmos de EstiloLa evolución de los sistemas de recomendación en la industria de la moda exige trascender los modelos basados únicamente en identificadores estáticos de producto para capturar la semántica profunda y las sutilezas estéticas presentes en las imágenes de las prendas. Los enfoques tradicionales de catalogación a menudo sufren pérdidas críticas de información al convertir señales visuales complejas en metadatos textuales toscos. Con el advenimiento de los Modelos de Lenguaje Multimodales (MM-LLMs), es posible estructurar descripciones complejas y normalizar atributos finos de manera automatizada directamente desde imágenes en bruto.Este reporte presenta una propuesta arquitectónica detallada para implementar una canalización de software que realiza dos tareas fundamentales. En primer lugar, extrae de manera determinista un esquema enriquecido de metadatos a partir de fotografías de prendas de vestir utilizando el SDK de IA de Vercel y modelos de visión avanzados. En segundo lugar, define un modelo híbrido de recomendación de conjuntos (outfits) sensible al clima local, el tipo de día, la agenda del usuario y los principios estéticos del diseño de armarios cápsula.1. Arquitectura de Extracción Multimodal de MetadatosPara integrar la capacidad de identificar metadatos de prendas de vestir a partir de imágenes, es indispensable mitigar la discrepancia de representación que existe entre las salidas de texto libre generadas por modelos generativos y los esquemas tipados que demandan las bases de datos transaccionales. En el desarrollo moderno con JavaScript y TypeScript, esto se resuelve mediante decodificación restringida por esquemas utilizando el SDK de IA de Vercel con validación en tiempo de ejecución gobernada por Zod.La validez del esquema representa la línea base en entornos de producción, pero la elección del mecanismo para forzar dicha estructura afecta directamente la fidelidad semántica del modelo, un fenómeno conocido como penalización de calidad semántica o quality tax. Cuando un modelo se ve forzado a ceñirse de forma estricta a un esquema a nivel de tokens, la probabilidad de que elija términos precisos pero semánticamente complejos disminuye, tendiendo a favorecer valores predeterminados seguros de las listas enums.Modo de Salida EstructuradaMecanismo TécnicoTasa de Validez de EsquemaPenalización Semántica (Quality Tax)Latencia en ProducciónOpenAI Strict ModeCompila el esquema JSON en una gramática de decodificación que restringe los logits a nivel de token en el muestreo.Excepcional (>99.9%)Baja en esquemas simples; del 10% al 15% en esquemas profundamente anidados.Baja (procesamiento acelerado por hardware a nivel de logit).Anthropic Tool UseConversión implícita del esquema en una llamada a funciones de herramientas, procesada internamente por el modelo.Alta (~97% - 99%)Mínima (el modelo mantiene el flujo libre de atención y generación antes del formateo).Media (requiere procesamiento adicional de tokens de llamada a herramientas).Gemini responseSchemaValidación del esquema JSON en el lado del servidor y rechazo de respuestas que violen la estructura.Muy Alta (~98%)Muy Baja (el modelo opera con menor restricción durante el muestreo inicial).Baja (optimizado para integraciones en la nube de Google).Outlines / FSM ConstraintsEnmascaramiento de logits mediante autómatas de estado finito sobre modelos de peso abierto en infraestructura propia.Absoluta (100% de cumplimiento matemático)Alta en modelos pequeños (15% a 20% en parámetros inferiores a 8B debido a la distorsión de la distribución nativa).Variable (depende del aprovisionamiento de GPU local o servidores dedicados).Para capturar detalles finos y evitar fallos silenciosos, la implementación propuesta utiliza modelos multimodales líderes como Claude 3.5 Sonnet o GPT-4o, configurando el análisis visual con un nivel de detalle alto. Esto obliga al modelo a procesar la imagen en múltiples parches de alta resolución, facilitando la identificación de texturas, patrones del tejido y tipos de costuras. Adicionalmente, el diseño del esquema de extracción de datos sigue el principio de usar campos explícitamente obligatorios que aceptan valores nulos en lugar de campos opcionales. Esta estructura obliga al modelo a evaluar conscientemente la existencia del atributo en la imagen, reduciendo las omisiones arbitrarias de datos.2. Metadatos Expandidos para Recomendaciones Basadas en Clima, Día y ContextoPara que el sistema recomiende conjuntos de manera inteligente en función de variables ambientales, temporales y sociales, se debe expandir la metadata básica del objeto de prenda original. Un sistema de recomendación contextualizado no solo debe conocer la categoría o el estilo de la prenda, sino también sus propiedades físicas y su viabilidad estética dentro de reglas de combinación como la proporción del armario cápsula.El armario cápsula moderno opera como un sistema cerrado de alta interoperabilidad donde un conjunto reducido de piezas (habitualmente entre 30 y 50 artículos) es capaz de generar una cantidad exponencial de combinaciones viables. El éxito algorítmico de este armario depende de mantener una proporción de 70% de prendas básicas neutras de alta compatibilidad y 30% de prendas de acento o de declaración visual.La expansión propuesta para el modelo de datos preserva de forma exacta todos los campos originales del usuario (incluyendo sus validaciones de subcategorías específicas en Mongoose) e integra nuevas dimensiones clave:Parámetros de Aislamiento Térmico e Impermeabilidad: Permiten responder de forma científica al clima combinando prendas que satisfagan el balance de confort térmico.Capas y Posicionamiento: Permite al sistema aplicar la regla de la tercera pieza y el sistema de superposición de capas (layering), indispensable en climas de alta oscilación térmica diurna.Variables de Formalidad y Contextos: Evitan que el recomendador cometa errores de código de vestimenta, alineando el outfit con la agenda diaria del usuario.Rol de Armario Cápsula y Paleta de Colores: Ayuda a balancear el peso visual de los conjuntos, previniendo combinaciones sobrecargadas o desordenadas cromáticamente.Variable de Entrada ContextualOrigen del DatoCampo de Metadatos RelacionadoImplicación en el Algoritmo de RecomendaciónTemperatura Actual y HumedadAPI Meteorológica de Tiempo Real (ej. OpenWeatherMap).climaCloCalcula el rango de aislamiento térmico objetivo del conjunto completo mediante sumatoria de unidades Clo.Probabilidad de LluviaAPI Meteorológica de Tiempo Real.impermeabilidadActiva un filtro estricto que obliga a seleccionar una capa exterior repelente o impermeable y calzado de alta protección.Actividades del CalendarioAPI de Calendario del Usuario (Google Calendar, Outlook).ocasionesModula el espectro de formalidad exigible para el conjunto, descartando prendas no aptas para el entorno social o laboral inmediato.Tipo de Día (Semanal vs. Fin de Semana)Fecha y Hora del Sistema.ocasionesPermite alternar de manera automatizada entre lógicas de vestimenta estructurada de oficina y outfits relajados de descanso.Paleta de Color de la TemporadaConfiguración de Estilo del Usuario.colores y rolCapsulaGobierna la selección cromática aplicando la proporción visual 60-30-10 para asegurar una armonía tonal estéticamente agradable.Para fundamentar científicamente el confort climático, el sistema calcula de forma determinista la disipación térmica del cuerpo humano a través de la vestimenta midiendo el índice Clo, donde un valor de 1 Clo equivale al aislamiento que necesita un humano en reposo a una temperatura de 21 °C con una humedad del 50% y viento en calma. La resistencia térmica teórica requerida por el outfit ($I_{\text{cl}}$, expresada en unidades Clo) para mantener la homeostasis corporal se modela de acuerdo con la temperatura ambiente mediante la siguiente ecuación física:$$I_{\text{cl}} = \frac{30.7 - T_{\text{ambiente}}}{10.3}$$Donde $T_{\text{ambiente}}$ representa la temperatura en grados Celsius. Al recuperar las prendas de la base de datos, el algoritmo de recomendación selecciona una combinación de capas cuya sumatoria de coeficientes de aislamiento térmico cumpla con la restricción de confort:$$I_{\text{cl}} = \frac{30.7 - T_{\text{ambiente}}}{10.3}$$Simultáneamente, el sistema calcula la compatibilidad estética de las prendas comparando sus representaciones vectoriales densas (embeddings) mediante la similitud del coseno, garantizando que el conjunto no solo sea térmicamente funcional, sino estéticamente armónico:$$\sum_{i=1}^{n} \text{climaClo}_i \approx I_{\text{cl}} \pm 0.15$$Donde $\mathbf{e}_A$ y $\mathbf{e}_B$ son los vectores estéticos generados a partir de los metadatos visuales normalizados de las prendas.3. Implementación de la Inferencia Multimodal y PersistenciaPara implementar este flujo de trabajo dentro de una aplicación basada en Next.js con soporte para renderizado híbrido y Server Actions, se deben acoplar de forma limpia la extracción tipada de Zod, la validación de negocio cruzada y la persistencia en MongoDB. El uso de esquemas puramente definidos en Zod permite estructurar la validación en la frontera de la API antes de delegar la escritura al ORM Mongoose, lo que elimina validaciones redundantes y agiliza el rendimiento del sistema.Definición de Tipos y Esquemas de Validación (Zod)TypeScript// types/prenda-ia.ts
import { z } from 'zod';

export const CategoriasRelaciones = {
  Superior: ['Camiseta', 'Camisa', 'Hoodie', 'Chamarra', 'Suéter', 'Top'],
  Inferior: ['Jeans', 'Pantalón', 'Shorts', 'Cargo', 'Joggers', 'Falda'],
  Entero: ['Vestido', 'Mono', 'Overol'],
  Calzado: ['Sneakers', 'Botas', 'Zapatos Formales', 'Sandalias'],
  Accesorios: ['Gorra', 'Bufanda', 'Cinturón', 'Lentes', 'Mochila', 'Bolso']
} as const;

export const MetadatosIAExtendidaSchema = z.object({
  categoria: z.enum(['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios'])
    .describe('Categoría principal de la prenda visible en la fotografía.'),
  
  subcategoria: z.string()
    .describe('Subcategoría específica de la prenda. Debe pertenecer estrictamente a la categoría asignada.'),
  
  colores: z.array(z.string())
    .min(1, 'Especifique al menos un color visible.')
    .describe('Colores dominantes identificados, mapeados a nombres canónicos (ej. Azul Marino, Negro, Blanco, Beige).'),
  
  estaciones: z.array(z.enum(['Primavera', 'Verano', 'Otoño', 'Invierno']))
    .min(1, 'Asigne al menos una estación del año.')
    .describe('Estaciones en las que la prenda puede ser utilizada confortablemente.'),
  
  estilo: z.array(z.string())
    .min(1, 'Especifique al menos un estilo aplicable.')
    .describe('Estilo estético que proyecta la prenda (ej. Minimalista, Casual, Formal, Grunge, Deportivo, Preppy, Bohemio).'),
  
  talla: z.string()
    .describe('Talla estimada que presenta la prenda.'),
  
  climaClo: z.number()
    .min(0.0)
    .max(2.0)
    .describe('Valor de aislamiento térmico en unidades Clo. Ejemplos de referencia: Camiseta ligera: 0.1; Camisa de vestir: 0.2; Suéter de lana fina: 0.35; Hoodie o sudadera gruesa: 0.4; Chamarra acolchada: 0.8; Parka pesada o abrigo largo: 1.2.'),
  
  impermeabilidad: z.enum(['Sin Proteccion', 'Repelente', 'Impermeable'])
    .describe('Nivel de protección física de la prenda contra las precipitaciones.'),
  
  ocasiones: z.array(z.enum(['Trabajo', 'Deporte', 'Social', 'Formal', 'Hogar', 'Playa']))
    .min(1, 'Debe especificar al menos un evento o contexto social compatible.')
    .describe('Contextos sociales recomendados para el uso de la prenda.'),
  
  capaPosicion: z.enum(['Interior', 'Media', 'Exterior', 'Única'])
    .describe('Posición que ocupa la prenda en la lógica de superposición de ropa. Interior: playeras de tirantes o camisetas base; Media: camisas, suéteres o sudaderas; Exterior: abrigos, parkas o chaquetas; Única: pantalones, calzado y vestidos.'),
  
  rolCapsula: z.enum(['Esencial Neutro', 'Pieza de Acento', 'Declaración'])
    .describe('Clasificación de la prenda según la teoría del armario cápsula. Esencial Neutro: cortes atemporales en tonos básicos (Blanco, Negro, Gris, Beige); Pieza de Acento: añade variaciones cromáticas controladas; Declaración: patrones llamativos, texturas marcadas o siluetas arriesgadas.'),
  
  texturaMaterial: z.string()
    .describe('Patrón visual predominante en la tela de la prenda (ej. Liso, Micro-raya, Cuadros Tartán, Estampado Gráfico, Denim, Pana).'),
  
  notas: z.string()
    .max(300, 'Las notas descriptivas no pueden superar los 300 caracteres.')
    .nullable()
    .describe('Comentarios analíticos adicionales sobre el corte, tipo de cuello, tejido y detalles específicos.')
}).refine((data) => {
  const permitidos = CategoriasRelaciones[data.categoria as keyof typeof CategoriasRelaciones];
  return permitidos ? permitidos.includes(data.subcategoria) : false;
}, {
  message: 'La subcategoría seleccionada es incompatible con la categoría de la prenda.',
  path: ['subcategoria']
});

export const RegistroPrendaIASchema = z.object({
  nombre: z.string().min(3).max(80),
  imagenes: z.array(z.string().url()).min(1).max(4),
  estado: z.enum(['Disponible', 'Sucio', 'Lavandería']).default('Disponible'),
  metadata: MetadatosIAExtendidaSchema
});

export type IRegistroPrendaIA = z.infer<typeof RegistroPrendaIASchema>;
Definición del Modelo de Base de Datos y Persistencia (Mongoose)TypeScript// models/Prenda.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMetadatosExtendidos {
  categoria: 'Superior' | 'Inferior' | 'Entero' | 'Calzado' | 'Accesorios';
  subcategoria: string;
  colores: string[];
  estaciones: string[];
  estilo: string[];
  talla: string;
  climaClo: number;
  impermeabilidad: 'Sin Proteccion' | 'Repelente' | 'Impermeable';
  ocasiones: ('Trabajo' | 'Deporte' | 'Social' | 'Formal' | 'Hogar' | 'Playa')[];
  capaPosicion: 'Interior' | 'Media' | 'Exterior' | 'Única';
  rolCapsula: 'Esencial Neutro' | 'Pieza de Acento' | 'Declaración';
  texturaMaterial: string;
  notas?: string | null;
}

export interface IPrendaDocument extends Document {
  nombre: string;
  imagenes: string[];
  estado: 'Disponible' | 'Sucio' | 'Lavandería';
  metadata: IMetadatosExtendidos;
  createdAt: Date;
  updatedAt: Date;
}

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
        const cat = this.categoria || (this.parent && this.parent().metadata ? this.parent().metadata.categoria : null);
        return cat ? (relaciones[cat]?.includes(val) ?? false) : false;
      },
      message: 'La subcategoría no corresponde a la categoría seleccionada.'
    }
  },
  colores: {
    type: [String],
    required: [true, 'Debe ingresar al menos un color.'],
    validate: {
      validator: (val: string[]) => val && val.length > 0,
      message: 'Debe especificar al menos un color.'
    }
  },
  estaciones: {
    type: [String],
    required: [true, 'Debe ingresar al menos una estación.'],
    validate: {
      validator: (val: string[]) => val && val.length > 0,
      message: 'Debe especificar al menos una estación.'
    }
  },
  estilo: {
    type: [String],
    required: [true, 'Debe especificar al menos un estilo.'],
    validate: {
      validator: (val: string[]) => val && val.length > 0,
      message: 'Debe especificar al menos un estilo.'
    }
  },
  talla: {
    type: String,
    required: [true, 'La talla es obligatoria.'],
    trim: true
  },
  climaClo: {
    type: Number,
    required: [true, 'El valor de aislamiento térmico Clo es obligatorio.'],
    min: 0.0,
    max: 2.0
  },
  impermeabilidad: {
    type: String,
    required: [true, 'El nivel de impermeabilidad es obligatorio.'],
    enum: ['Sin Proteccion', 'Repelente', 'Impermeable'],
    default: 'Sin Proteccion'
  },
  ocasiones: {
    type: [String],
    required: [true, 'Debe especificar al menos un contexto social apto.'],
    enum: ['Trabajo', 'Deporte', 'Social', 'Formal', 'Hogar', 'Playa']
  },
  capaPosicion: {
    type: String,
    required: [true, 'La posición de capa en el conjunto es obligatoria.'],
    enum: ['Interior', 'Media', 'Exterior', 'Única']
  },
  rolCapsula: {
    type: String,
    required: [true, 'El rol de armario cápsula es obligatorio.'],
    enum: ['Esencial Neutro', 'Pieza de Acento', 'Declaración'],
    default: 'Esencial Neutro'
  },
  texturaMaterial: {
    type: String,
    required: [true, 'La textura predominante o patrón es obligatoria.'],
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
      validator: (val: string[]) => val && val.length > 0 && val.length <= 4,
      message: 'Debe subir entre 1 y 4 imágenes de la prenda.'
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

const Prenda: Model<IPrendaDocument> = mongoose.models.Prenda || mongoose.model<IPrendaDocument>('Prenda', PrendaSchema);
export default Prenda;
Ejecución de Inferencia Multimodal Automatizada (Next.js Server Action)TypeScript// actions/prenda.ts
'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { RegistroPrendaIASchema, IRegistroPrendaIA } from '@/types/prenda-ia';
import Prenda from '@/models/Prenda';
import mongoose from 'mongoose';

/**
 * Server Action que recibe las referencias de las imágenes procesadas y guardadas
 * en el almacenamiento cloud (ej. AWS S3, Cloudinary) junto con su buffer en base64,
 * ejecuta la extracción por visión con IA, valida el esquema y lo guarda en MongoDB.
 */
export async function procesarYRegistrarPrenda(
  imagenesUrls: string[],
  imagenesBase64: string[] // Array de strings en base64 de las imágenes cargadas correspondientes
): Promise<{ success: boolean; data?: IRegistroPrendaIA; error?: string }> {
  try {
    if (!imagenesUrls || imagenesUrls.length === 0 || imagenesBase64.length === 0) {
      return { success: false, error: 'Se requiere al menos una imagen cargada.' };
    }

    // Inicialización del cliente de conexión a base de datos
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || '');
    }

    // Preparar el mensaje del usuario estructurado con múltiples componentes multimodales
    const contenidoMensaje = [
      {
        type: 'text' as const,
        text: 'Inspecciona visualmente la prenda de vestir mostrada en las imágenes adjuntas. Extrae detalladamente todos sus atributos de acuerdo con el esquema JSON provisto. Pon especial atención a los coeficientes térmicos (Clo) basándote en el material y grosor percibido, y determina de forma lógica las ocasiones de uso, el nivel de impermeabilidad y el rol de armario cápsula.'
      },
      ...imagenesBase64.map((b64) => ({
        type: 'image' as const,
        image: b64,
        mimeType: 'image/jpeg'
      }))
    ];

    // Llamada de inferencia visual restrictiva mediante el SDK de IA de Vercel
    const { object: metadatosExtrados } = await generateObject({
      model: openai('gpt-4o'), // Modelo de frontera para tareas de visión y extracción de alta precisión
      schema: RegistroPrendaIASchema.shape.metadata,
      system: 'Actúas como un clasificador robótico altamente preciso de un sistema de gestión de inventario de moda. No infieras información ausente; limítate a evaluar fríamente los patrones textiles, capas corporales y texturas de la prenda visible.',
      messages: [
        {
          role: 'user',
          content: contenidoMensaje
        }
      ]
    });

    // Generación de un nombre automático basado en los metadatos descriptivos detectados
    const nombreGenerado = `${metadatosExtrados.categoria} ${metadatosExtrados.subcategoria} ${metadatosExtrados.colores.join('-')}`;

    // Construcción del objeto completo de la Prenda
    const payloadPrendaCompleta: IRegistroPrendaIA = {
      nombre: nombreGenerado.slice(0, 80),
      imagenes: imagenesUrls,
      estado: 'Disponible',
      metadata: metadatosExtrados
    };

    // Validación sintáctica en la frontera de persistencia mediante Zod
    const payloadValidado = RegistroPrendaIASchema.parse(payloadPrendaCompleta);

    // Guardado en la base de datos de MongoDB
    const nuevaPrenda = new Prenda(payloadValidado);
    await nuevaPrenda.save();

    return {
      success: true,
      data: payloadValidado
    };

  } catch (error: any) {
    console.error('Error de ejecución en Server Action de Extracción:', error);
    return {
      success: false,
      error: error.message || 'Ocurrió un error inesperado durante el procesamiento de la prenda.'
    };
  }
}
4. El Motor de Recomendación Contextual: Modelos y Algoritmo de SelecciónEl diseño del motor de recomendaciones para coordinar outfits se enfrenta a desafíos inherentes a la industria de la moda: alta rotación de productos (lo que genera un problema crónico de arranque en frío en matrices dispersas de interacción), comparaciones de compra exhaustivas basadas en combinaciones estéticas y variabilidad según estacionalidades. El uso de redes neuronales convolucionales básicas o algoritmos rígidos de filtrado colaborativo falla al modelar la cohesión global de estilo que un usuario evalúa al vestirse.Para superar estas limitaciones, se propone un flujo de trabajo basado en un Sistema de Recuperación Híbrido en Dos Etapas que integra búsquedas estructuradas en bases de datos con razonamiento semántico avanzado mediado por modelos de lenguaje eficientes:+------------------------------------------------------------------------+
|                                  ETAPA 1                               |
|        Filtro de Infraestructura y Recuperación Lógica de la DB        |
|                                                                        |
|  * Excluye prendas no disponibles (estado !== "Disponible").|
|  * Ejecuta búsqueda vectorial usando pgvector / AlloyDB.    |
|  * Filtra candidatos duros de clima mediante ecuación de Clo.|
+-----------------------------------+------------------------------------+
                                    |
                                    | Conjunto depurado de candidatos
                                    v
+------------------------------------------------------------------------+
|                                  ETAPA 2                               |
|          Generación y Curaduría Estética (Agente Orquestador)          |
|                                                                        |
|  * Evalúa combinaciones óptimas de color aplicando la regla 60-30-10.|
|  * Valida combinaciones de capas (Sistema de Capas de Vestimenta).|
|  * Genera el output final con explicaciones estilísticas y consejos [cite: 28].|
+------------------------------------------------------------------------+
Modelos de IA Recomendados para RecomendaciónEtapa de Extracción de Embeddings de Estilo (Fase de Recuperación): Se propone el uso de modelos multimodales ligeros alineados mediante aprendizaje contrastivo (como arquitecturas inspiradas en LLM-SCRec con optimizaciones InfoNCE). Estos alinean la semántica visual profunda extraída por un codificador de imágenes con señales textuales nativas de la plataforma (ej. etiquetas de estilo y notas de material), mitigando el problema del arranque en frío de nuevas prendas. Las representaciones se almacenan en una base de datos vectorial como AlloyDB optimizada con índices ScaNN, garantizando búsquedas de compatibilidad en milisegundos.Etapa de Orquestación y Estilo Conversacional (Fase de Generación): Para el procesamiento del agente estilista se recomiendan modelos con excelente balance costo-beneficio y baja latencia de inferencia en producción, tales como GPT-4o-mini, Gemini 1.5 Flash, o modelos locales desplegados mediante contenedores que ejecutan Llama 3 8B. Estos modelos presentan un nivel sofisticado de razonamiento basado en lenguaje natural, ideal para asimilar complejas directrices de moda y reglas estructuradas de diseño de armarios cápsula.Codificación de Reglas Estéticas y Capsule WardrobeEl agente de recomendación ejecuta de forma estricta las siguientes directrices estilísticas clásicas para asegurar armonía en los conjuntos propuestos:Regla de la Tercera Pieza: Para climas moderados y formales, el modelo debe añadir un elemento estructurado como chaqueta, blazer o gabardina que dé volumen y profundidad formal al torso.Armonía Cromática 60-30-10: El outfit se compone de un color base neutro (60% del peso visual del conjunto, comúnmente una prenda superior e inferior en bloque), un color de soporte secundario que aporte profundidad armónica (30%, p. ej. en la tercera capa o calzado), y un color de acento brillante o de patrón (10% en accesorios como cinturones, bufandas o lentes).Regla de la Relación 1:3: Para optimizar el armario, el recomendador evalúa la versatilidad de cada prenda seleccionada en relación con el inventario total disponible del usuario, priorizando aquellas que pueden combinarse de manera viable en al menos tres conjuntos diferentes antes de promover su uso repetido en outfits idénticos.Implementación del Generador de Outfits ContextualTypeScript// services/recomendador.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import Prenda, { IPrendaDocument } from '@/models/Prenda';
import mongoose from 'mongoose';

interface IEntradaContextual {
  temperatura: number;       // API Clima local (°C)
  probabilidadLluvia: number;// API Clima local (0 - 100 %)
  diaSemana: string;         // Fecha del sistema (ej: "Sábado")
  actividadAgenda: string;   // Calendario (ej: "Reunión ejecutiva con inversionistas")
  estiloPreferencia: string; // Perfil del usuario (ej: "Minimalista Escandinavo")
}

export async function generarOutfitContextual(
  contexto: IEntradaContextual
): Promise<string> {
  // Asegurar conexión a MongoDB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || '');
  }

  // 1. Recuperación y Pre-filtrado (Filtros Duros) en Base de Datos
  const prendasDisponibles = await Prenda.find({ estado: 'Disponible' }).lean() as unknown as IPrendaDocument[];

  // Cálculo matemático del aislamiento térmico Clo objetivo
  const cloObjetivo = (30.7 - contexto.temperatura) / 10.3;

  // Formateo compacto del inventario disponible para alimentar el contexto del LLM
  const catalogoCompactado = prendasDisponibles.map((p) => ({
    id: p._id.toString(),
    nombre: p.nombre,
    categoria: p.metadata.categoria,
    subcategoria: p.metadata.subcategoria,
    colores: p.metadata.colores,
    climaClo: p.metadata.climaClo,
    impermeabilidad: p.metadata.impermeabilidad,
    ocasiones: p.metadata.ocasiones,
    capaPosicion: p.metadata.capaPosicion,
    rolCapsula: p.metadata.rolCapsula,
    textura: p.metadata.texturaMaterial,
    estilos: p.metadata.estilo
  }));

  const systemPrompt = `
    Eres un estilista de moda profesional con un doctorado en ingeniería textil y teoría cromática aplicada. Tu objetivo es proponer el OUTFIT PERFECTO combinando exclusivamente elementos del inventario disponible del usuario.

    INFORMACIÓN DE CONTEXTO REAL:
    - Temperatura actual: ${contexto.temperatura}°C. El outfit propuesto debe sumar un Clo total acumulado de aproximadamente: ${cloObjetivo.toFixed(2)} (tolerancia de +/- 0.15 Clo).
    - Probabilidad de lluvia: ${contexto.probabilidadLluvia}%. Si supera el 40%, debes exigir de forma obligatoria que la capa exterior o el calzado tengan una impermeabilidad "Repelente" o "Impermeable".
    - Día de la semana: ${contexto.diaSemana}.
    - Evento principal del usuario hoy: "${contexto.actividadAgenda}".
    - Estilo predilecto: "${contexto.estiloPreferencia}".

    DIRECTRICES ESTÉTICAS RIGUROSAS:
    1. Un outfit completo debe estructurarse obligatoriamente de forma lógica: (1 parte Superior + 1 parte Inferior + 1 Calzado) o (1 Entero + 1 Calzado). Opcionalmente se pueden añadir capas (Media, Exterior) y Accesorios según requiera el clima.
    2. Respeta el sistema de capas de vestimenta de forma física. No coloques una capa "Interior" sobre una "Exterior".
    3. Aplica la Proporción Cromática 60-30-10 para mitigar el desorden cromático: un color dominante en base neutra (60%), un color complementario secundario (30%) y un acento controlado de diseño o pieza de acento (10%).
    4. Aplica la Regla de la Tercera Pieza si el valor de Clo lo permite para otorgar sofisticación.
    5. No mezcles estilos incompatibles de forma tosca. Si el contexto es formal o corporativo, evita la selección de calzado o prendas puramente deportivas.
  `;

  const userPrompt = `
    A continuación se lista mi catálogo de prendas disponibles en formato JSON:
    ${JSON.stringify(catalogoCompactado, null, 2)}

    Por favor, genera la recomendación del conjunto óptimo para el día de hoy. Estructura tu respuesta en un formato fluido y sofisticado que incluya las siguientes secciones delimitadas por encabezados planos en Markdown:

    ## CONJUNTO RECOMENDADO
    Especifica las prendas seleccionadas indicando su ID de base de datos, nombre exacto, categoría y rol dentro del armario cápsula.

    ## JUSTIFICACIÓN TÉRMICA Y CLIMÁTICA
    Explica la sumatoria del aislamiento térmico de las prendas (confort térmico acumulado) y por qué responde de manera adecuada al clima exterior e impermeabilidad ante precipitaciones.

    ## EXPLICACIÓN DE ESTILO Y COMPOSICIÓN CROMÁTICA
    Detalla la relación estética del conjunto, cómo se aplica la regla de color 60-30-10, la lógica de capas seleccionada (tercera pieza si aplica), y la idoneidad del look para el evento "${contexto.actividadAgenda}" programado en el calendario.
  `;

  // Ejecución del motor conversacional con GPT-4o-mini
  const { text: recomendacionOutfit } = await generateText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.6, // Nivel óptimo de creatividad controlada dentro de los parámetros de diseño
    maxTokens: 1500
  });

  return recomendacionOutfit;
}
5. Consideraciones de Escalabilidad y ObservabilidadLa incorporación de procesos de análisis visual con inteligencia artificial en arquitecturas Web en tiempo real puede introducir cuellos de botella severos si no se estructuran con un enfoque de optimización del rendimiento. Para mitigar esto, es fundamental garantizar que las llamadas a esquemas de validación complejos de Zod se realicen estrictamente en la frontera del sistema o en puntos de ingesta únicos, evitando procesamientos redundantes de los mismos objetos de datos dentro de bucles de consulta de persistencia repetitivos.Adicionalmente, se recomienda delegar las validaciones estructurales pesadas y transformaciones de datos complejas fuera de los procesos principales utilizando hilos paralelos (Web Workers) o colas de fondo asíncronas, garantizando que el ciclo de vida del hilo principal de Node.js permanezca disponible.+-------------------------------------------------------------------------+
|                              FLUJO OPTIMIZADO                           |
|                                                                         |
|  [Ingesta de Imagen]                                                    |
|         |                                                               |
|         v                                                               |
|  [Inferencia y Validación con Zod]  <-- Solo se procesa en este punto   |
|         |                                                               |
|         v                                                               |
|  [Objeto Validado y Tipado Seguro]  <-- Se considera seguro internamente|
|         |                                                               |
|         +------------------------+-----------------------+              |
|         |                        |                       |              |
|         v                        v                       v              |
|  [Guardar en DB]          [Indexar Cache]      [Enviar a Recomendador]  |
+-------------------------------------------------------------------------+
A nivel corporativo, un sistema de recomendación que opera en producción requiere métricas estrictas de monitoreo. La observabilidad del sistema se puede resolver implementando OpenTelemetry conectado de forma nativa a herramientas de análisis de ejecución de IA como Langfuse.Esto proporciona información detallada en tres aspectos esenciales:Tasa de Fallo de Esquema vs. Tasa de Reintentos: Permite identificar de manera oportuna si un cambio en el modelo de visión o en las imágenes de entrada está provocando infracciones sintácticas que dejen el sistema fuera de servicio.Latencia de Inferencia Visual Multimodal: Monitorea de forma constante los tiempos de respuesta de los proveedores de LLM, controlando las desviaciones y optimizando la selección de los modelos de visión de acuerdo con el balance de costo-beneficio.Análisis de Desviación Semántica: Rastrea el impacto de la decodificación restringida (quality tax) sobre la calidad final de las notas descriptivas recopiladas en el inventario.6. Conclusiones y Recomendaciones de IngenieríaLa estructuración de una canalización que combina la extracción automatizada de metadatos de ropa por medio de modelos visuales con un recomendador de outfits sensible al contexto constituye un sistema integral de alta fidelidad técnica. Al contrastar el diseño planteado con los requerimientos transaccionales clásicos, se concluye que la cohabitación de herramientas robustas de TypeScript (Zod) junto a la modularidad flexible de Mongoose soluciona de forma definitiva la inestabilidad inherente a las APIs de generación de datos.Para una implementación exitosa del proyecto, el equipo de ingeniería debe adoptar las siguientes directrices clave:Firma Unificada de Validaciones: Exportar el esquema de Zod directamente desde la capa compartida de tipos de la aplicación, garantizando que tanto los validadores del cliente (pantalla de edición del armario), la Server Action de ingesta por IA y la persistencia en MongoDB permanezcan coordinados ante cualquier extensión futura del modelo.Arquitectura de Recomendación Basada en Memoria Vectorial: Evitar sobrecargar el contexto de los modelos conversacionales inyectando catálogos de inventario sin filtrar. En su lugar, el sistema debe estructurarse mediante un enfoque de base de datos vectorial en AlloyDB para realizar el filtrado de proximidad de estilo antes de presentar opciones finalistas al recomendador conversacional, optimizando significativamente los tiempos de inferencia y los costos de tokens de entrada.Monitoreo del Desempeño y Calidad Semántica: Implementar el monitoreo de traces mediante Langfuse con OpenTelemetry para mantener visibilidad constante sobre la latencia, la validez sintáctica de las respuestas de IA y el impacto del canon de calidad de decodificación restringida sobre las descripciones semánticas recopiladas.