import mongoose from 'mongoose';
import Prenda from '../lib/models/Prenda';
import { PrendaZodSchema } from '../lib/validations/prenda';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/closet_digital';

const validGarmentData = {
  nombre: 'Chamarra de Mezclilla Azul',
  imagenes: ['https://example.com/chamarra.jpg'],
  estado: 'Disponible',
  metadata: {
    categoria: 'Superior',
    subcategoria: 'Chamarra',
    colores: ['Azul Claro'],
    estaciones: ['Primavera', 'Otoño'],
    estilo: ['Casual', 'Streetwear'],
    talla: 'M',
    notas: 'Lavar por separado.'
  }
};

async function testZodValidation() {
  console.log('\n--- Probando Validación Zod (Frontend/Action) ---');
  
  // Caso Válido
  const validParse = PrendaZodSchema.safeParse(validGarmentData);
  console.log(`✅ Registro Válido Zod: ${validParse.success ? 'PASÓ' : 'FALLÓ'}`);
  if (!validParse.success) {
    console.error(validParse.error.flatten());
  }

  // Caso Inválido: Nombre muy corto
  const invalidName = { ...validGarmentData, nombre: 'Ab' };
  const parseName = PrendaZodSchema.safeParse(invalidName);
  console.log(`❌ Validación Nombre Corto: ${!parseName.success ? 'PASÓ (Falló correctamente)' : 'FALLÓ (Permitió guardar)'}`);
  if (!parseName.success) {
    console.log(`   Mensaje de error: ${parseName.error.flatten().fieldErrors.nombre}`);
  }

  // Caso Inválido: Sin imágenes
  const noImages = { ...validGarmentData, imagenes: [] };
  const parseNoImages = PrendaZodSchema.safeParse(noImages);
  console.log(`❌ Validación Sin Imágenes: ${!parseNoImages.success ? 'PASÓ (Falló correctamente)' : 'FALLÓ (Permitió guardar)'}`);
  if (!parseNoImages.success) {
    console.log(`   Mensaje de error: ${parseNoImages.error.flatten().fieldErrors.imagenes}`);
  }

  // Caso Inválido: Más de 4 imágenes
  const fiveImages = {
    ...validGarmentData,
    imagenes: [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
      'https://example.com/4.jpg',
      'https://example.com/5.jpg'
    ]
  };
  const parseFiveImages = PrendaZodSchema.safeParse(fiveImages);
  console.log(`❌ Validación Límite Máximo de 4 Imágenes: ${!parseFiveImages.success ? 'PASÓ (Falló correctamente)' : 'FALLÓ (Permitió guardar)'}`);
  if (!parseFiveImages.success) {
    console.log(`   Mensaje de error: ${parseFiveImages.error.flatten().fieldErrors.imagenes}`);
  }

  // Caso Inválido: Categoría y Subcategoría incompatible
  const invalidSubcategory = {
    ...validGarmentData,
    metadata: {
      ...validGarmentData.metadata,
      categoria: 'Calzado',
      subcategoria: 'Camisa' // Camisa no pertenece a Calzado
    }
  };
  const parseSubcategory = PrendaZodSchema.safeParse(invalidSubcategory);
  console.log(`❌ Validación Categoría-Subcategoría Dinámica: ${!parseSubcategory.success ? 'PASÓ (Falló correctamente)' : 'FALLÓ (Permitió guardar)'}`);
  if (!parseSubcategory.success) {
    console.log(`   Mensaje de error: ${parseSubcategory.error.message}`);
  }
}

async function testDatabaseValidation() {
  console.log('\n--- Probando Validación Mongoose (Base de Datos) ---');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Conectado a la base de datos.');

    // Intentar guardar prenda válida (usando un id temporal que luego borraremos)
    const validPrenda = new Prenda(validGarmentData);
    await validPrenda.validate();
    console.log('✅ Validación Mongoose para datos válidos: PASÓ');

    // Intentar guardar con más de 4 imágenes en la BD
    const invalidPrendaData = {
      ...validGarmentData,
      imagenes: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg'
      ]
    };
    const invalidPrenda = new Prenda(invalidPrendaData);
    try {
      await invalidPrenda.validate();
      console.log('❌ Validación Mongoose Límite de Imágenes: FALLÓ (No arrojó error)');
    } catch (err: any) {
      console.log(`✅ Validación Mongoose Límite de Imágenes: PASÓ (Falló correctamente: ${err.errors.imagenes?.message || err.message})`);
    }

    // Intentar guardar con categoría y subcategoría incompatibles en la BD
    const invalidSubcatPrendaData = {
      ...validGarmentData,
      metadata: {
        ...validGarmentData.metadata,
        categoria: 'Inferior',
        subcategoria: 'Camiseta' // Camiseta no pertenece a Inferior
      }
    };
    const invalidSubcatPrenda = new Prenda(invalidSubcatPrendaData);
    try {
      await invalidSubcatPrenda.validate();
      console.log('❌ Validación Mongoose Categoría-Subcategoría: FALLÓ (No arrojó error)');
    } catch (err: any) {
      console.log(`✅ Validación Mongoose Categoría-Subcategoría: PASÓ (Falló correctamente: ${err.errors['metadata.subcategoria']?.message || err.message})`);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba de base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos.');
  }
}

async function runTests() {
  await testZodValidation();
  await testDatabaseValidation();
}

runTests();
