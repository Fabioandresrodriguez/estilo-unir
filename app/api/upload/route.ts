import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos.' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Crear el directorio de subidas si no existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
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

      // Validar tamaño (5MB máx)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'El archivo excede el tamaño máximo permitido (5MB).' },
          { status: 400 }
        );
      }

      // Generar nombre de archivo único
      const extension = file.name.split('.').pop() || 'jpg';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
      const filePath = join(uploadDir, uniqueName);

      // Escribir archivo en disco
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      // Registrar URL relativa accesible por el navegador
      urls.push(`/uploads/${uniqueName}`);
    }

    return NextResponse.json({ urls }, { status: 200 });
  } catch (error: any) {
    console.error('Error al procesar subida de archivo:', error);
    return NextResponse.json({ error: 'Error interno en el servidor al subir imágenes.' }, { status: 500 });
  }
}
