'use server';

import connectDB from '@/lib/db';
import Prenda from '@/lib/models/Prenda';
import { PrendaZodSchema } from '@/lib/validations/prenda';
import { revalidatePath } from 'next/cache';

export async function createPrendaAction(prevState: any, data: any) {
  try {
    // 1. Conexión a Base de Datos
    await connectDB();

    // 2. Validación de Esquema con Zod
    const validatedData = PrendaZodSchema.safeParse(data);
    
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors,
        message: 'Datos de la prenda inválidos. Revise los errores.'
      };
    }

    // 3. Inserción en Base de Datos
    const nuevaPrenda = new Prenda(validatedData.data);
    await nuevaPrenda.save();

    // 4. Revalidación de Caché de la galería
    revalidatePath('/');
    
    return {
      success: true,
      message: 'Prenda registrada con éxito en el guardarropa.'
    };

  } catch (error: any) {
    console.error('Error en Server Action createPrendaAction:', error);
    return {
      success: false,
      message: 'Error interno en el servidor al guardar la prenda.'
    };
  }
}

export async function updatePrendaEstadoAction(prendaId: string, nuevoEstado: string) {
  try {
    // 1. Conexión a Base de Datos
    await connectDB();

    // 2. Validar que el estado sea correcto
    const estadosValidos = ['Disponible', 'Sucio', 'Lavandería'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return { success: false, message: 'Estado de prenda inválido.' };
    }

    // 3. Buscar y actualizar
    const prendaActualizada = await Prenda.findByIdAndUpdate(
      prendaId,
      { estado: nuevoEstado },
      { new: true, runValidators: true }
    );

    if (!prendaActualizada) {
      return { success: false, message: 'La prenda no existe.' };
    }

    // 4. Invalidar la caché para refrescar la galería
    revalidatePath('/');
    
    return { 
      success: true, 
      prenda: JSON.parse(JSON.stringify(prendaActualizada)),
      message: 'Estado de disponibilidad actualizado.' 
    };

  } catch (error: any) {
    console.error('Error en Server Action updatePrendaEstadoAction:', error);
    return { success: false, message: 'Fallo al procesar la actualización en base de datos.' };
  }
}

export async function getPrendaByIdAction(id: string) {
  try {
    await connectDB();
    const prenda = await Prenda.findById(id).lean();
    if (!prenda) {
      return { success: false, message: 'La prenda no existe.' };
    }
    return { 
      success: true, 
      prenda: JSON.parse(JSON.stringify(prenda)) 
    };
  } catch (error: any) {
    console.error('Error en Server Action getPrendaByIdAction:', error);
    return { success: false, message: 'Error interno al consultar la prenda.' };
  }
}
