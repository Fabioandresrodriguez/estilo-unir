import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize the S3 client using credentials from the environment (.env)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  try {
    // 1. Detect if it's an AWS S3 URL: https://[bucket].s3.[region].amazonaws.com/[key]
    const s3UrlPattern = /^https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)$/;
    const match = url.match(s3UrlPattern);

    if (match) {
      const bucketName = match[1];
      const region = match[2];
      const key = decodeURIComponent(match[3]);

      try {
        // Fetch the object from AWS S3 using server-side keys
        const s3Response = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        );

        if (!s3Response.Body) {
          return new NextResponse('Empty response body from S3', { status: 500 });
        }

        const contentType = s3Response.ContentType || 'image/jpeg';
        const bytes = await s3Response.Body.transformToByteArray();

        return new NextResponse(Buffer.from(bytes), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable', // Cache in browser for 1 year
          },
        });

      } catch (s3Error: any) {
        console.error(`S3 GetObject failed for key ${key}, falling back to fetch:`, s3Error);
        // Fallback to fetch in case the bucket name or keys are mismatched but it's somehow fetchable
      }
    }

    // 2. Fallback: regular HTTP fetch (e.g. for unsplash seeds, local images)
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image from source: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('Error in proxy-image API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
