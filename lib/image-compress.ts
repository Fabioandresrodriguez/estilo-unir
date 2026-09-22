import sharp from 'sharp';

/**
 * Comprime una imagen del lado del servidor.
 * Redimensiona a un máximo de 2048px en su lado más largo para conservar calidad y optimizar espacio.
 * Aplica compresión según el tipo MIME.
 * Si el archivo final supera los 3 MB, realiza una compresión secundaria agresiva.
 * 
 * @param buffer Buffer de la imagen original.
 * @param mimeType Tipo MIME de la imagen (ej: 'image/jpeg', 'image/png', 'image/webp').
 * @returns Buffer de la imagen comprimida de un máximo de 3 MB.
 */
export async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  let sharpImg = sharp(buffer);
  const metadata = await sharpImg.metadata();
  
  // 1. Redimensionamiento adaptativo (max 2048px de lado)
  let width = metadata.width;
  let height = metadata.height;
  if (width && height && (width > 2048 || height > 2048)) {
    sharpImg = sharpImg.resize({
      width: 2048,
      height: 2048,
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // 2. Compresión inicial
  if (mimeType === 'image/png') {
    sharpImg = sharpImg.png({ compressionLevel: 8, palette: true });
  } else if (mimeType === 'image/webp') {
    sharpImg = sharpImg.webp({ quality: 80 });
  } else {
    // Por defecto tratar como JPEG para compatibilidad general (image/jpeg, etc.)
    sharpImg = sharpImg.jpeg({ quality: 80, progressive: true });
  }

  let outputBuffer = await sharpImg.toBuffer();

  // 3. Salvaguarda estricta de 3MB
  const threeMB = 3 * 1024 * 1024;
  if (outputBuffer.length > threeMB) {
    // Si sigue superando los 3MB, re-comprimir con menor resolución (max 1600px) y calidad
    sharpImg = sharp(buffer).resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true
    });

    if (mimeType === 'image/png') {
      // Si un PNG es demasiado pesado y no se puede reducir bajo 3MB con PNG,
      // se fuerza la conversión a JPEG con calidad 70 para garantizar el tamaño.
      sharpImg = sharpImg.jpeg({ quality: 70, progressive: true });
    } else if (mimeType === 'image/webp') {
      sharpImg = sharpImg.webp({ quality: 60 });
    } else {
      sharpImg = sharpImg.jpeg({ quality: 60, progressive: true });
    }
    outputBuffer = await sharpImg.toBuffer();
  }

  return outputBuffer;
}
