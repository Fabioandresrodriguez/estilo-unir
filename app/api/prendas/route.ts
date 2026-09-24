import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const estado = searchParams.get('estado');
    const colores = searchParams.get('colores');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);

    const query: any = {};

    if (categoria) {
      query['metadata.categoria'] = categoria;
    }
    if (estado) {
      query.estado = estado;
    }
    if (colores) {
      query['metadata.colores'] = { $in: colores.split(',') };
    }

    const skip = (page - 1) * limit;

    const [prendas, totalItems] = await Promise.all([
      Prenda.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prenda.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const proxiedPrendas = JSON.parse(JSON.stringify(prendas)).map((prenda: any) => {
      if (prenda.imagenes) {
        prenda.imagenes = prenda.imagenes.map((img: string) => {
          if (img && !img.startsWith('/') && !img.startsWith('data:')) {
            return `/api/proxy-image?url=${encodeURIComponent(img)}`;
          }
          return img;
        });
      }
      return prenda;
    });

    return NextResponse.json({
      data: proxiedPrendas,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/prendas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al consultar prendas.' },
      { status: 500 }
    );
  }
}
