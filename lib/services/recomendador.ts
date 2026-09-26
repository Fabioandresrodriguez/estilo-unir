import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';
import { IPrenda } from '@/types/prenda';

interface RecomendacionContexto {
  temperatura: number;
  lluvia: boolean | number;
  ocasion: string;
}

export interface OutfitSugerido {
  nombre: string;
  prendas: string[]; // IDs de prendas
  justificacionEstilo: string;
}

export interface ResultadoRecomendacion {
  success: boolean;
  message: string;
  insuficiente?: boolean;
  outfits?: OutfitSugerido[];
}

export async function generarRecomendaciones(contexto: RecomendacionContexto): Promise<ResultadoRecomendacion> {
  try {
    await connectDB();

    // 1. Obtener todas las prendas en estado Disponible
    const prendas: IPrenda[] = await Prenda.find({ estado: 'Disponible' }).lean() as any;

    const superiores = prendas.filter(p => p.metadata.categoria === 'Superior');
    const inferiores = prendas.filter(p => p.metadata.categoria === 'Inferior');
    const calzados = prendas.filter(p => p.metadata.categoria === 'Calzado');
    const enteros = prendas.filter(p => p.metadata.categoria === 'Entero');

    // 2. Comprobar si hay inventario suficiente para al menos 2 combinaciones viables (Escenario 3)
    // Combinación viable: (Superior + Inferior + Calzado) OR (Entero + Calzado)
    const combinacionesSuperiores = superiores.length * inferiores.length * calzados.length;
    const combinacionesEnteros = enteros.length * calzados.length;
    const totalCombinaciones = combinacionesSuperiores + combinacionesEnteros;

    if (totalCombinaciones < 2) {
      return {
        success: false,
        insuficiente: true,
        message: 'No hay suficientes prendas disponibles para crear al menos 2 combinaciones. Por favor, lava tu ropa o registra más prendas en tu clóset.'
      };
    }

    // 3. Evaluar probabilidad de lluvia y priorizar prendas repelentes/impermeables (Escenario 2)
    const esLluvia = typeof contexto.lluvia === 'boolean' ? contexto.lluvia : (contexto.lluvia > 30);
    
    // Preparar el catálogo de prendas disponibles formateado para el prompt de la IA
    const catalogoIA = prendas.map(p => ({
      id: p._id?.toString(),
      nombre: p.nombre,
      categoria: p.metadata.categoria,
      subcategoria: p.metadata.subcategoria,
      colores: p.metadata.colores,
      estilo: p.metadata.estilo,
      talla: p.metadata.talla,
      climaClo: p.metadata.climaClo,
      impermeabilidad: p.metadata.impermeabilidad,
      capaPosicion: p.metadata.capaPosicion,
      rolCapsula: p.metadata.rolCapsula,
      ocasiones: p.metadata.ocasiones
    }));

    // Inyectar contexto y reglas dinámicamente en el prompt de la IA
    const systemPrompt = `Eres el estilista personal del sistema Clóset Digital. Tu trabajo es diseñar hasta 3 opciones de outfits completos utilizando ÚNICAMENTE las prendas del catálogo que te proveerá el usuario.

REGLAS DE DISEÑO DE OUTFITS:
1. Regla Cromática 60-30-10: Cada outfit debe estructurarse asignando un color principal de base neutra (60%), un color complementario secundario (30%) y una pieza de acento (10%).
2. Consistencia en Capas: Respeta la lógica física de las capas (capaPosicion: 'Interior', 'Media', 'Exterior', 'Única'). Nunca sugieras una capa interior colocada encima de una capa exterior.
3. Rotación y Versatilidad: Prioriza prendas que combinen bien en múltiples configuraciones para evitar la repetición del mismo conjunto.
4. Lluvia y Clima: Si se indica clima frío o lluvia, adapta los outfits. Si llueve, prioriza prendas de abrigo y calzado resistentes al agua (impermeabilidad: 'Repelente' o 'Impermeable').

FORMATO DE RESPUESTA REQUERIDO (JSON puro sin markdown):
{
  "outfits": [
    {
      "nombre": "Nombre descriptivo y atractivo del Outfit (ej: Casual Elegante para Lluvia)",
      "prendas": ["id_prenda_1", "id_prenda_2", ...], // IDs del catálogo suministrado
      "justificacionEstilo": "Justificación en español del conjunto explicando la armonía de colores (60-30-10) y por qué se adapta al clima/lluvia y a la ocasión."
    }
  ]
}`;

    const userPrompt = `CATÁLOGO DE PRENDAS DISPONIBLES:
${JSON.stringify(catalogoIA, null, 2)}

CONTEXTO DE HOY:
- Ocasión: ${contexto.ocasion}
- Temperatura: ${contexto.temperatura}°C
- Lluvia: ${esLluvia ? 'Sí (alta probabilidad)' : 'No'}

Por favor diseña hasta 3 opciones de outfits completos ideales para este contexto respetando todas las reglas.`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('Falta la variable de entorno OPENROUTER_API_KEY');
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/drago-do/estilo',
        'X-Title': 'Clóset Digital Estilo - Recomendador'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`Error en llamada a OpenRouter: ${openRouterResponse.statusText}`);
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Respuesta vacía del recomendador de IA.');
    }

    const parsedData = JSON.parse(content);
    return {
      success: true,
      message: 'Recomendaciones generadas exitosamente.',
      outfits: parsedData.outfits || []
    };

  } catch (error: any) {
    console.error('Error en generarRecomendaciones:', error);
    return {
      success: false,
      message: error.message || 'Error interno del servidor al procesar recomendaciones.'
    };
  }
}
