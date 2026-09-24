import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

async function main() {
  console.log('--- AWS S3 DIAGNOSTIC CONFIG ---');
  console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
  console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'PRESENT (len: ' + process.env.AWS_SECRET_ACCESS_KEY.length + ')' : 'ABSENT');
  console.log('AWS_REGION:', process.env.AWS_REGION);
  console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);

  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const bucketName = process.env.AWS_BUCKET_NAME || 'personal.dragodo.cloud';
  const key = 'estilos/superior/1781992894681-0ra4zzf-1000120083.png';

  console.log('\n--- ATTEMPTING GETOBJECTCOMMAND ---');
  console.log('Bucket:', bucketName);
  console.log('Key:', key);

  try {
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    console.log('\n✅ SUCCESS!');
    console.log('HTTP Status Code:', s3Response.$metadata.httpStatusCode);
    console.log('Content Type:', s3Response.ContentType);
    console.log('Content Length:', s3Response.ContentLength);
  } catch (error: any) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Code:', error.$metadata?.httpStatusCode);
    console.error('Error Object:', error);
  }
}

main();
