import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!estado) {
      return NextResponse.json({ error: 'El estado es obligatorio.' }, { status: 400 });
    }

    const estadosValidos = ['Disponible', 'Sucio', 'Lavandería'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado de prenda inválido.' }, { status: 400 });
    }

    await connectDB();

    const prendaActualizada = await Prenda.findByIdAndUpdate(
      id,
      { estado },
      { new: true, runValidators: true }
    );

    if (!prendaActualizada) {
      return NextResponse.json({ error: 'La prenda con el ID especificado no existe.' }, { status: 404 });
    }

    // Revalidate paths to refresh gallery views
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      prenda: JSON.parse(JSON.stringify(prendaActualizada))
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/prendas/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
