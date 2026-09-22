import { NextRequest, NextResponse } from 'next/server';
import { compressImage } from '@/lib/image-compress';
import { uploadToS3 } from '@/lib/s3-upload';
import { removeImageBackground } from '@/lib/background-removal';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const categoria = (formData.get('categoria') as string) || 'varios';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos.' }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'El formato de archivo no es compatible. Use JPG, PNG o WEBP.' },
          { status: 400 }
        );
      }

      // Validar tamaño (10MB máx)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'El archivo excede el tamaño máximo permitido (10MB).' },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // 1. Eliminar fondo de la imagen
      const { buffer: noBgBuffer, mimeType: noBgMimeType } = await removeImageBackground(fileBuffer, file.type);

      // 2. Comprimir la imagen sin fondo (mantiene transparencia)
      const { buffer, extension } = await compressImage(noBgBuffer, noBgMimeType);

      // Limpiar nombre de archivo original
      const originalName = file.name || 'foto.jpg';
      const baseName = originalName.split('.').slice(0, -1).join('.') || 'foto';
      const cleanFileName = `${baseName}.${extension}`;

      // Determinar MIME type final según la extensión comprimida
      const finalMimeType = extension === 'webp' ? 'image/webp' : (extension === 'png' ? 'image/png' : 'image/jpeg');

      // 3. Subir a AWS S3
      const s3Url = await uploadToS3(buffer, cleanFileName, finalMimeType, categoria);
      urls.push(s3Url);
    }

    return NextResponse.json({ urls }, { status: 200 });
  } catch (error: any) {
    console.error('Error al procesar subida de archivo:', error);
    if (error.message && error.message.includes('Configuración de AWS S3 incompleta')) {
      return NextResponse.json(
        { error: 'Error interno en el servidor: Configuración de almacenamiento incompleta.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Error interno en el servidor al subir imágenes.' }, { status: 500 });
  }
}

