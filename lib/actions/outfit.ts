'use server';

import connectDB from '@/lib/db';
import Outfit from '@/lib/models/Outfit';
import Prenda from '@/lib/models/Prenda';
import { IOutfitContext } from '@/types/outfit';

export async function selectOutfitAction(data: {
  prendas: string[];
  contexto: IOutfitContext;
  justificacionEstilo: string;
}) {
  try {
    await connectDB();

    if (!data.prendas || data.prendas.length < 2 || data.prendas.length > 5) {
      throw new Error('Debe incluir al menos 2 prendas para formar un outfit completo y máximo 5.');
    }

    // 1. Guardar el Outfit en MongoDB
    const nuevoOutfit = new Outfit({
      fecha: new Date(),
      prendas: data.prendas,
      contexto: data.contexto,
      justificacionEstilo: data.justificacionEstilo
    });

    const saved = await nuevoOutfit.save();

    // 2. Cambiar de forma masiva el estado de todas las prendas que componen el outfit a 'Sucio'
    await Prenda.updateMany(
      { _id: { $in: data.prendas } },
      { $set: { estado: 'Sucio' } }
    );

    return {
      success: true,
      id: saved._id.toString(),
      message: 'Outfit guardado con éxito. Las prendas se han marcado como sucias.'
    };
  } catch (error: any) {
    console.error('Error en selectOutfitAction:', error);
    return {
      success: false,
      error: error.message || 'Error al guardar la selección de outfit.'
    };
  }
}
