import mongoose from 'mongoose';
import Prenda from '../lib/models/Prenda';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/closet_digital';

const prendasDePrueba = [
  {
    nombre: 'Hoodie Oversized Negro',
    imagenes: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Hoodie',
      colores: ['Negro'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Streetwear', 'Casual'],
      talla: 'L',
      notas: 'Algodón pesado, lavar al revés para cuidar el color.'
    }
  },
  {
    nombre: 'Camiseta Básica de Algodón Blanca',
    imagenes: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Camiseta',
      colores: ['Blanco'],
      estaciones: ['Primavera', 'Verano', 'Todo el año'],
      estilo: ['Casual', 'Streetwear'],
      talla: 'M',
      notas: 'Corte regular, básica para capas.'
    }
  },
  {
    nombre: 'Jeans Denim Recto Azul Claro',
    imagenes: ['https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600'],
    estado: 'Sucio',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Jeans',
      colores: ['Azul Claro'],
      estaciones: ['Primavera', 'Otoño', 'Todo el año'],
      estilo: ['Casual', 'Streetwear'],
      talla: '32',
      notas: 'Mezclilla rígida sin elastano.'
    }
  },
  {
    nombre: 'Cargo Pants Verde Oliva',
    imagenes: ['https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=600'],
    estado: 'Lavandería',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Cargo',
      colores: ['Verde Oliva'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Streetwear', 'Deportivo'],
      talla: '30',
      notas: 'Bolsillos laterales espaciosos.'
    }
  },
  {
    nombre: 'Sneakers Retro Blancos',
    imagenes: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Calzado',
      subcategoria: 'Sneakers',
      colores: ['Blanco', 'Gris'],
      estaciones: ['Todo el año'],
      estilo: ['Casual', 'Streetwear', 'Deportivo'],
      talla: '42',
      notas: 'Limpiar suela después de usar en días lluviosos.'
    }
  },
  {
    nombre: 'Chamarra de Cuero Negra Biker',
    imagenes: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Chamarra',
      colores: ['Negro'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Streetwear', 'Casual', 'Fiesta'],
      talla: 'M',
      notas: 'Cuero genuino, no exponer al agua directa.'
    }
  },
  {
    nombre: 'Pantalón Chino Beige',
    imagenes: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Pantalón',
      colores: ['Beige'],
      estaciones: ['Primavera', 'Verano'],
      estilo: ['Formal', 'Casual', 'Oficina'],
      talla: '32',
      notas: 'Tela delgada y elástica.'
    }
  },
  {
    nombre: 'Camisa Formal Slim Fit Azul Marino',
    imagenes: ['https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600'],
    estado: 'Sucio',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Camisa',
      colores: ['Azul Marino'],
      estaciones: ['Todo el año'],
      estilo: ['Formal', 'Oficina'],
      talla: 'M',
      notas: 'Requiere planchado a vapor.'
    }
  },
  {
    nombre: 'Botas de Piel Café',
    imagenes: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Calzado',
      subcategoria: 'Botas',
      colores: ['Café'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Formal', 'Casual'],
      talla: '43',
      notas: 'Hidratar la piel cada tres meses.'
    }
  },
  {
    nombre: 'Shorts Deportivos Negros',
    imagenes: ['https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Shorts',
      colores: ['Negro'],
      estaciones: ['Verano'],
      estilo: ['Deportivo'],
      talla: 'M',
      notas: 'Material transpirable, secado rápido.'
    }
  },
  {
    nombre: 'Suéter de Lana Burdeos',
    imagenes: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Superior',
      subcategoria: 'Suéter',
      colores: ['Burdeos'],
      estaciones: ['Otoño', 'Invierno'],
      estilo: ['Casual', 'Formal', 'Oficina'],
      talla: 'L',
      notas: 'Lavar únicamente a mano con agua fría.'
    }
  },
  {
    nombre: 'Vestido Midi Rojo',
    imagenes: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Entero',
      subcategoria: 'Vestido',
      colores: ['Rojo'],
      estaciones: ['Primavera', 'Verano'],
      estilo: ['Formal', 'Fiesta'],
      talla: 'S',
      notas: 'Vestido de fiesta elegante.'
    }
  },
  {
    nombre: 'Joggers Básicos Grises',
    imagenes: ['https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=600'],
    estado: 'Sucio',
    metadata: {
      categoria: 'Inferior',
      subcategoria: 'Joggers',
      colores: ['Gris'],
      estaciones: ['Otoño', 'Invierno', 'Todo el año'],
      estilo: ['Casual', 'Deportivo', 'Streetwear'],
      talla: 'M',
      notas: 'Algodón frisado súper cómodo.'
    }
  },
  {
    nombre: 'Gorra de Gabardina Negra',
    imagenes: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Gorra',
      colores: ['Negro'],
      estaciones: ['Primavera', 'Verano', 'Todo el año'],
      estilo: ['Casual', 'Streetwear', 'Deportivo'],
      talla: 'Ajustable',
      notas: 'Visera curva clásica.'
    }
  },
  {
    nombre: 'Overol de Mezclilla Azul Marino',
    imagenes: ['https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Entero',
      subcategoria: 'Overol',
      colores: ['Azul Marino'],
      estaciones: ['Primavera', 'Otoño'],
      estilo: ['Casual', 'Streetwear'],
      talla: 'M',
      notas: 'Estilo vintage clásico.'
    }
  },
  {
    nombre: 'Bufanda Tejida Gris Oscuro',
    imagenes: ['https://images.unsplash.com/photo-1520903928273-0f44b2a2eed5?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Bufanda',
      colores: ['Gris'],
      estaciones: ['Invierno'],
      estilo: ['Casual', 'Formal'],
      talla: 'Única',
      notas: 'Lana acrílica suave.'
    }
  },
  {
    nombre: 'Cinturón de Piel Negro',
    imagenes: ['https://images.unsplash.com/photo-1624222247344-550fb8ecf7db?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Cinturón',
      colores: ['Negro'],
      estaciones: ['Todo el año'],
      estilo: ['Formal', 'Oficina', 'Casual'],
      talla: '34',
      notas: 'Hebilla plateada satinada.'
    }
  },
  {
    nombre: 'Sandalias de Cuero Beige',
    imagenes: ['https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Calzado',
      subcategoria: 'Sandalias',
      colores: ['Beige'],
      estaciones: ['Verano'],
      estilo: ['Casual'],
      talla: '41',
      notas: 'Suela de corcho anatómica.'
    }
  },
  {
    nombre: 'Lentes de Sol Retro Negros',
    imagenes: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Lentes',
      colores: ['Negro'],
      estaciones: ['Primavera', 'Verano', 'Todo el año'],
      estilo: ['Streetwear', 'Casual', 'Fiesta'],
      talla: 'Única',
      notas: 'Protección UV400.'
    }
  },
  {
    nombre: 'Mochila de Lona Impermeable Gris',
    imagenes: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600'],
    estado: 'Disponible',
    metadata: {
      categoria: 'Accesorios',
      subcategoria: 'Mochila',
      colores: ['Gris'],
      estaciones: ['Todo el año'],
      estilo: ['Casual', 'Deportivo', 'Oficina'],
      talla: '20L',
      notas: 'Compartimento acolchado para laptop de 15 pulgadas.'
    }
  }
];

async function seed() {
  try {
    console.log('⏳ Conectando a MongoDB para inicialización de datos...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión establecida.');

    console.log('🧹 Limpiando colección de prendas...');
    const deleteResult = await Prenda.deleteMany({});
    console.log(`🗑️ Se eliminaron ${deleteResult.deletedCount} prendas anteriores.`);

    console.log('🌱 Insertando datos de catálogo iniciales (20 prendas de prueba)...');
    const creadas = await Prenda.insertMany(prendasDePrueba);
    console.log(`🎉 Seed completado con éxito. Se insertaron ${creadas.length} prendas.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar el script de seed:', error);
    process.exit(1);
  }
}

seed();
