import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';
import { revalidatePath } from 'next/cache';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, estado } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'El arreglo de ids está vacío.' }, { status: 400 });
    }

    const estadosValidos = ['Disponible', 'Sucio', 'Lavandería'];
    if (!estado || !estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado de prenda inválido.' }, { status: 400 });
    }

    await connectDB();

    const result = await Prenda.updateMany(
      { _id: { $in: ids } },
      { $set: { estado } }
    );

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Se cambiaron ${result.modifiedCount} prendas al estado '${estado}' con éxito.`
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/prendas/bulk-status:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
