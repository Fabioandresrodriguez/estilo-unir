import { NextRequest, NextResponse } from 'next/server';
import {
  categoriasValidas,
  coloresValidos,
  estacionesValidas,
  estilosValidos,
  impermeabilidadValida,
  capaPosicionValida,
  rolCapsulaValido,
  ocasionesValidas,
  relacionCategoriaSubcategoria
} from '@/lib/validations/prenda';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'La imagen es obligatoria para realizar el análisis.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('Falta la variable de entorno OPENROUTER_API_KEY');
      return NextResponse.json(
        { error: 'El servicio de análisis de imagen no está configurado.' },
        { status: 500 }
      );
    }

    // Asegurar que la imagen tenga el formato correcto para data URL
    let imageUrl = image;
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    // Construcción dinámica del prompt inyectando las constantes y relaciones del código
    const systemPrompt = `Eres un asistente experto en moda y clasificación de ropa del sistema Clóset Digital.
Analiza la imagen de la prenda suministrada y devuelve un objeto JSON estructurado con los metadatos correspondientes.

Debes utilizar ÚNICAMENTE los términos válidos especificados a continuación para cada campo. Cualquier otro término causará un error en nuestro validador.

REGLAS DE CLASIFICACIÓN Y ENUMS PERMITIDOS:
1. categoria: Debe ser exactamente uno de: ${JSON.stringify(categoriasValidas)}
2. subcategoria: Dependiendo de la 'categoria' elegida en el paso anterior, debe ser exactamente uno de los valores válidos indicados en este mapeo:
${JSON.stringify(relacionCategoriaSubcategoria, null, 2)}
3. colores: Debe ser un arreglo que contenga entre 1 y 3 colores seleccionados estrictamente de esta lista: ${JSON.stringify(coloresValidos)}
4. estaciones: Debe ser un arreglo con al menos una estación seleccionada de: ${JSON.stringify(estacionesValidas)}
5. estilo: Debe ser un arreglo con al menos un estilo seleccionado de: ${JSON.stringify(estilosValidos)}
6. talla: Si es visible alguna etiqueta o es evidente infiere la talla (ej: "S", "M", "L", "XL", "32"), de lo contrario devuelve una cadena vacía "".
7. climaClo: Un número flotante estimado del nivel de aislamiento térmico de la prenda, entre 0.0 y 2.0 (ej. Camiseta = 0.15, Suéter = 0.35, Chamarra pesada = 0.70).
8. impermeabilidad: Debe ser exactamente uno de: ${JSON.stringify(impermeabilidadValida)}
9. capaPosicion: Debe ser exactamente uno de: ${JSON.stringify(capaPosicionValida)}
10. rolCapsula: Debe ser exactamente uno de: ${JSON.stringify(rolCapsulaValido)}
11. ocasiones: Arreglo de ocasiones recomendadas de uso, seleccionadas de: ${JSON.stringify(ocasionesValidas)}
12. texturaMaterial: Descripción corta y textual del material o textura visible (ej. "Lana tejida gruesa", "Algodón ligero", "Poliéster deportivo", "Cuero rígido").

FORMATO DE RETORNO OBLIGATORIO (JSON puro sin markdown):
{
  "nombre": "Nombre descriptivo y comercial de la prenda basado en sus atributos (ej: Sudadera Básica Gris con Gorro)",
  "metadata": {
    "categoria": "...",
    "subcategoria": "...",
    "colores": ["..."],
    "estaciones": ["..."],
    "estilo": ["..."],
    "talla": "...",
    "climaClo": 0.0,
    "impermeabilidad": "...",
    "capaPosicion": "...",
    "rolCapsula": "...",
    "ocasiones": ["..."],
    "texturaMaterial": "..."
  }
}`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/drago-do/estilo',
        'X-Title': 'Clóset Digital Estilo'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiza detalladamente esta prenda de vestir y genera el JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('Error de OpenRouter:', errorText);
      return NextResponse.json(
        { error: `Error del proveedor de IA: ${openRouterResponse.statusText}` },
        { status: openRouterResponse.status }
      );
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Respuesta vacía o inesperada de OpenRouter.');
    }

    const parsedMetadata = JSON.parse(content);
    return NextResponse.json(parsedMetadata);

  } catch (error: any) {
    console.error('Error en POST /api/prendas/analyze-image:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor durante el análisis.' },
      { status: 500 }
    );
  }
}
