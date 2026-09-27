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

async function testOutfitSelection() {
  console.log('\n--- Probando Acción de Selección de Outfit (HU14) ---');

  try {
    const { default: connectDB } = await import('../lib/db');
    const { default: Prenda } = await import('../lib/models/Prenda');
    const { default: Outfit } = await import('../lib/models/Outfit');
    const { selectOutfitAction } = await import('../lib/actions/outfit');
    await connectDB();
    console.log('🔌 Conectado a la base de datos.');

    // 1. Crear dos prendas ficticias disponibles para la prueba
    const prenda1 = new Prenda({
      nombre: 'Camisa Test Selección',
      estado: 'Disponible',
      imagenUrl: 'http://example.com/camisa-test.jpg',
      imagenes: ['http://example.com/camisa-test.jpg'],
      metadata: {
        categoria: 'Superior',
        subcategoria: 'Camisa',
        colores: ['Blanco'],
        estilo: 'Casual',
        estaciones: ['Primavera']
      }
    });

    const prenda2 = new Prenda({
      nombre: 'Pantalón Test Selección',
      estado: 'Disponible',
      imagenUrl: 'http://example.com/pantalon-test.jpg',
      imagenes: ['http://example.com/pantalon-test.jpg'],
      metadata: {
        categoria: 'Inferior',
        subcategoria: 'Jeans',
        colores: ['Azul'],
        estilo: 'Casual',
        estaciones: ['Primavera']
      }
    });

    await prenda1.save();
    await prenda2.save();
    console.log('✅ Creadas prendas de prueba en estado Disponible.');

    const dummyPrendasIds = [prenda1._id.toString(), prenda2._id.toString()];

    // 2. Invocar selectOutfitAction
    const context = {
      temperatura: 18,
      lluvia: false,
      ocasion: 'Casual'
    };
    const justification = 'Combinación clásica de camisa blanca y vaqueros azules.';

    console.log('🔄 Ejecutando selectOutfitAction...');
    const result = await selectOutfitAction({
      prendas: dummyPrendasIds,
      contexto: context,
      justificacionEstilo: justification
    });

    console.log(`Resultado de la acción: success=${result.success}`);
    if (result.success) {
      console.log(`✅ Outfit guardado con ID: ${result.id}`);

      // 3. Verificar persistencia del Outfit en MongoDB
      const savedOutfit = await Outfit.findById(result.id);
      if (savedOutfit) {
        console.log('✅ Outfit persistido correctamente en la colección Outfits.');
      } else {
        console.log('❌ Error: El outfit no se encontró en la colección Outfits.');
      }

      // 4. Verificar cambio de estado a 'Sucio' de las prendas
      const updatedPrenda1 = await Prenda.findById(prenda1._id);
      const updatedPrenda2 = await Prenda.findById(prenda2._id);

      if (updatedPrenda1?.estado === 'Sucio' && updatedPrenda2?.estado === 'Sucio') {
        console.log('✅ Éxito: Todas las prendas se marcaron correctamente como "Sucio" en la base de datos.');
      } else {
        console.log(`❌ Error: El estado de las prendas no cambió correctamente. Prenda1: ${updatedPrenda1?.estado}, Prenda2: ${updatedPrenda2?.estado}`);
      }
    } else {
      console.log('❌ Error al ejecutar selectOutfitAction:', result.error);
    }

    // Limpieza de datos de prueba
    await Prenda.deleteOne({ _id: prenda1._id });
    await Prenda.deleteOne({ _id: prenda2._id });
    if (result.success) {
      await Outfit.deleteOne({ _id: result.id });
    }
    console.log('🧹 Limpieza de datos de prueba completada.');

  } catch (error) {
    console.error('❌ Error inesperado durante el test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos.');
  }
}

testOutfitSelection();
