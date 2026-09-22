import { removeBackground } from '@imgly/background-removal-node';

/**
 * Remueve el fondo de una imagen provista en un Buffer y retorna el Buffer transparente.
 * Si el procesamiento falla por cualquier motivo, registra el error y retorna el buffer original
 * como fallback para no detener el flujo del usuario.
 * 
 * @param buffer Buffer de la imagen original.
 * @returns Objeto con el Buffer transparente (o el original si falla) y el tipo MIME estimado.
 */
export async function removeImageBackground(buffer: Buffer): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    console.log('Iniciando proceso de eliminación de fondo con @imgly/background-removal-node...');
    const startTime = Date.now();
    
    // removeBackground acepta buffers directamente y procesa localmente con ONNX
    const resultBlob = await removeBackground(buffer);
    
    // Convertir el Blob de respuesta a un Buffer de Node.js
    const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
    
    console.log(`Eliminación de fondo exitosa en ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    
    return {
      buffer: resultBuffer,
      mimeType: 'image/png', // Por defecto, el output transparente es PNG
    };
  } catch (error) {
    console.error('Fallo en el motor de eliminación de fondo, activando fallback:', error);
    // Retornamos el buffer original y mimeType genérico para no interrumpir el registro de la prenda
    return {
      buffer,
      mimeType: 'image/jpeg',
    };
  }
}
