import fs from 'fs';
import path from 'path';

// Parse .env FIRST before importing modules that depend on process.env
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

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/closet_digital';

async function runTest() {
  console.log('--- Iniciando prueba de Motor de Recomendación Híbrido ---');
  
  // Imprimir URI para depuración
  console.log('URI de MongoDB cargado:', process.env.MONGODB_URI);

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY no está configurado en el archivo .env');
    process.exit(1);
  }

  try {
    const { generarRecomendaciones } = await import('../lib/services/recomendador');
    // 2. Ejecutar motor de recomendaciones para clima Frío y ocasión Trabajo
    console.log('\n--- Probando Escenario 1: Clima Frío y Trabajo ---');
    const resultCold = await generarRecomendaciones({
      temperatura: 10,
      lluvia: false,
      ocasion: 'Trabajo'
    });

    console.log(`Estatus del resultado: ${resultCold.success ? 'ÉXITO' : 'FALLO'}`);
    console.log(`Mensaje: ${resultCold.message}`);

    if (resultCold.success && resultCold.outfits) {
      console.log('✅ Outfits Generados:');
      console.log(JSON.stringify(resultCold.outfits, null, 2));
    } else if (resultCold.insuficiente) {
      console.log('⚠️ Aviso de inventario insuficiente (Escenario 3): CORRECTO (El clóset tiene pocas prendas)');
    }

    // 3. Ejecutar motor de recomendaciones para clima Fresco y con Lluvia
    console.log('\n--- Probando Escenario 2: Clima Fresco con Lluvia ---');
    const resultRain = await generarRecomendaciones({
      temperatura: 15,
      lluvia: true,
      ocasion: 'Social'
    });

    console.log(`Estatus del resultado: ${resultRain.success ? 'ÉXITO' : 'FALLO'}`);
    console.log(`Mensaje: ${resultRain.message}`);

    if (resultRain.success && resultRain.outfits) {
      console.log('✅ Outfits Generados con Lluvia:');
      console.log(JSON.stringify(resultRain.outfits, null, 2));
    } else if (resultRain.insuficiente) {
      console.log('⚠️ Aviso de inventario insuficiente (Escenario 3): CORRECTO (El clóset tiene pocas prendas)');
    }

  } catch (error) {
    console.error('❌ Ocurrió un error inesperado durante el test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos.');
  }
}

runTest();
