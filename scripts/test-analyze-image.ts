import { NextRequest } from 'next/server';
import { POST } from '../app/api/prendas/analyze-image/route';
import fs from 'fs';
import path from 'path';

// Simple .env parser to load OPENROUTER_API_KEY
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

// 1x1 transparent GIF base64
const dummyBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

async function runTest() {
  console.log('--- Iniciando prueba de API de análisis de imagen ---');

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY no está configurado en el archivo .env');
    process.exit(1);
  }

  try {
    const requestObj = new Request('http://localhost:3000/api/prendas/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: dummyBase64
      })
    });

    const nextRequest = new NextRequest(requestObj);
    const response = await POST(nextRequest);
    
    console.log(`Status de Respuesta: ${response.status}`);
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Prueba Completada Exitosamente!');
      console.log('Resultado del análisis de la IA:');
      console.log(JSON.stringify(data, null, 2));
      
      // Validaciones básicas de la estructura
      if (data.nombre && data.metadata && data.metadata.categoria && data.metadata.subcategoria) {
        console.log('✅ Los campos clave "nombre", "metadata.categoria" y "metadata.subcategoria" están presentes.');
      } else {
        console.warn('⚠️ Advertencia: Algunos campos esperados no están en la respuesta.');
      }
    } else {
      console.error('❌ La prueba falló. Error devuelto:');
      console.error(data);
    }
  } catch (error) {
    console.error('❌ Ocurrió un error inesperado al ejecutar el test:', error);
  }
}

runTest();
