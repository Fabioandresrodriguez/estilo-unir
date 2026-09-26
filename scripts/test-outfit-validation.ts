import mongoose from 'mongoose';
import Outfit from '../lib/models/Outfit';
import fs from 'fs';
import path from 'path';

// Simple .env parser to load MONGODB_URI
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/closet_digital';

// IDs simulados para prendas constitutivas
const dummyPrendaId1 = new mongoose.Types.ObjectId();
const dummyPrendaId2 = new mongoose.Types.ObjectId();
const dummyPrendaId3 = new mongoose.Types.ObjectId();

const validOutfitData = {
  prendas: [dummyPrendaId1, dummyPrendaId2, dummyPrendaId3],
  contexto: {
    temperatura: 15,
    lluvia: false,
    ocasion: 'Trabajo'
  },
  justificacionEstilo: 'He seleccionado un conjunto formal con tonos oscuros y abrigo grueso para mantenerte abrigado.'
};

async function testOutfitValidation() {
  console.log('\n--- Probando Validación del Modelo Outfit (Mongoose) ---');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Conectado a la base de datos.');

    // 1. Caso Válido (Escenario 1)
    const validOutfit = new Outfit(validOutfitData);
    await validOutfit.validate();
    console.log('✅ Validación Outfit con 3 prendas (Escenario 1): PASÓ');

    // 2. Caso Inválido: Sin prendas (Escenario 2)
    const emptyOutfit = new Outfit({
      ...validOutfitData,
      prendas: []
    });
    try {
      await emptyOutfit.validate();
      console.log('❌ Validación Outfit Vacío: FALLÓ (No arrojó error)');
    } catch (err: any) {
      const errMsg = err.errors.prendas?.message;
      const expectedMsg = 'Debe incluir al menos 2 prendas para formar un outfit completo';
      if (errMsg === expectedMsg) {
        console.log(`✅ Validación Outfit Vacío (Escenario 2): PASÓ (Retornó el mensaje correcto: "${errMsg}")`);
      } else {
        console.log(`❌ Validación Outfit Vacío: FALLÓ (Mensaje incorrecto: "${errMsg}")`);
      }
    }

    // 3. Caso Inválido: 1 sola prenda (Escenario 2)
    const singleOutfit = new Outfit({
      ...validOutfitData,
      prendas: [dummyPrendaId1]
    });
    try {
      await singleOutfit.validate();
      console.log('❌ Validación Outfit con 1 prenda: FALLÓ (No arrojó error)');
    } catch (err: any) {
      const errMsg = err.errors.prendas?.message;
      const expectedMsg = 'Debe incluir al menos 2 prendas para formar un outfit completo';
      if (errMsg === expectedMsg) {
        console.log(`✅ Validación Outfit con 1 prenda (Escenario 2): PASÓ (Retornó el mensaje correcto: "${errMsg}")`);
      } else {
        console.log(`❌ Validación Outfit con 1 prenda: FALLÓ (Mensaje incorrecto: "${errMsg}")`);
      }
    }

    // 4. Caso Inválido: Demasiadas prendas (más de 5)
    const tooManyOutfit = new Outfit({
      ...validOutfitData,
      prendas: [
        dummyPrendaId1,
        dummyPrendaId2,
        dummyPrendaId3,
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ]
    });
    try {
      await tooManyOutfit.validate();
      console.log('❌ Validación Outfit con >5 prendas: FALLÓ (No arrojó error)');
    } catch (err: any) {
      console.log(`✅ Validación Outfit con >5 prendas: PASÓ (Falló correctamente: ${err.errors.prendas?.message})`);
    }

  } catch (error) {
    console.error('❌ Error inesperado durante la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos.');
  }
}

testOutfitValidation();
