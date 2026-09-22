import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Inicializar el cliente S3
// Nota: Las credenciales se leen automáticamente del entorno
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Sube un buffer de imagen a Amazon S3 en la carpeta estilos/[categoria]/
 * 
 * @param buffer Buffer de la imagen comprimida.
 * @param filename Nombre del archivo original o identificador único.
 * @param mimeType Tipo MIME de la imagen.
 * @param categoria Categoría de la prenda para clasificar la subcarpeta.
 * @returns URL absoluta del objeto subido.
 */
export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  categoria: string
): Promise<string> {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!bucketName || !region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Configuración de AWS S3 incompleta en variables de entorno.');
  }

  // Sanitizar el nombre de la subcarpeta (categoría en minúsculas)
  const folder = (categoria || 'varios')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-'); // Sanitizar caracteres especiales

  // Generar key (ruta completa dentro de S3)
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${filename}`;
  const key = `estilos/${folder}/${uniqueName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // Retornar la URL pública absoluta
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
