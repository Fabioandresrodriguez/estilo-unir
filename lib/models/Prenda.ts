import mongoose, { Schema, Document, Model } from 'mongoose';
import { IPrenda } from '@/types/prenda';

export interface IPrendaDocument extends Omit<IPrenda, '_id'>, Document {}

const MetadatosSchema = new Schema({
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria.'],
    enum: ['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios']
  },
  subcategoria: {
    type: String,
    required: [true, 'La subcategoría es obligatoria.'],
    validate: {
      validator: function(this: any, val: string) {
        const relaciones: Record<string, string[]> = {
          'Superior': ['Camiseta', 'Camisa', 'Hoodie', 'Chamarra', 'Suéter', 'Top'],
          'Inferior': ['Jeans', 'Pantalón', 'Shorts', 'Cargo', 'Joggers', 'Falda'],
          'Entero': ['Vestido', 'Mono', 'Overol'],
          'Calzado': ['Sneakers', 'Botas', 'Zapatos Formales', 'Sandalias'],
          'Accesorios': ['Gorra', 'Bufanda', 'Cinturón', 'Lentes', 'Mochila', 'Bolso']
        };
        
        // Obtenemos la categoría directamente del documento o del parent
        const cat = this.categoria || (this.parent && this.parent().metadata ? this.parent().metadata.categoria : null);
        return cat ? (relaciones[cat]?.includes(val) ?? false) : false;
      },
      message: 'La subcategoría no corresponde a la categoría seleccionada.'
    }
  },
  colores: {
    type: [String],
    required: [true, 'Debe ingresar al menos un color.'],
    validate: {
      validator: (val: string[]) => val && val.length > 0,
      message: 'Debe especificar al menos un color.'
    }
  },
  estaciones: {
    type: [String],
    required: [true, 'Debe ingresar al menos una estación.'],
    validate: {
      validator: (val: string[]) => val && val.length > 0,
      message: 'Debe especificar al menos una estación.'
    }
  },
  estilo: {
    type: [String],
    required: [true, 'Debe especificar al menos un estilo.'],
    validate: {
      validator: (val: string[]) => val && val.length > 0,
      message: 'Debe especificar al menos un estilo.'
    }
  },
  talla: {
    type: String,
    required: [true, 'La talla es obligatoria.'],
    trim: true
  },
  notas: {
    type: String,
    required: false,
    trim: true,
    maxlength: [300, 'Las notas no pueden superar los 300 caracteres.']
  }
}, { _id: false });

const PrendaSchema = new Schema<IPrendaDocument>({
  nombre: {
    type: String,
    required: [true, 'El nombre de la prenda es obligatorio.'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres.'],
    maxlength: [80, 'El nombre no puede superar los 80 caracteres.']
  },
  imagenes: {
    type: [String],
    required: [true, 'Debe subir al menos una imagen de la prenda.'],
    validate: {
      validator: (val: string[]) => val && val.length > 0,
      message: 'Debe haber al menos una imagen asociada.'
    }
  },
  estado: {
    type: String,
    required: true,
    enum: ['Disponible', 'Sucio', 'Lavandería'],
    default: 'Disponible'
  },
  metadata: {
    type: MetadatosSchema,
    required: true
  }
}, {
  timestamps: true
});

// Evitar la compilación múltiple del modelo en Next.js por recarga rápida (HMR)
const Prenda: Model<IPrendaDocument> = mongoose.models.Prenda || mongoose.model<IPrendaDocument>('Prenda', PrendaSchema);
export default Prenda;
