import { NextRequest, NextResponse } from 'next/server';
import { generarRecomendaciones } from '@/lib/services/recomendador';

export async function POST(request: NextRequest) {
  try {
    const { temperatura, lluvia, ocasion } = await request.json();

    if (temperatura === undefined || lluvia === undefined || !ocasion) {
      return NextResponse.json(
        { error: 'Las variables temperatura, lluvia y ocasion son requeridas.' },
        { status: 400 }
      );
    }

    const resultado = await generarRecomendaciones({
      temperatura: parseFloat(temperatura),
      lluvia,
      ocasion
    });

    if (resultado.insuficiente) {
      return NextResponse.json(
        { error: resultado.message, insuficiente: true },
        { status: 422 }
      );
    }

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: resultado.message,
      outfits: resultado.outfits
    });

  } catch (error: any) {
    console.error('Error en POST /api/recomendaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar las recomendaciones.' },
      { status: 500 }
    );
  }
}
