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
