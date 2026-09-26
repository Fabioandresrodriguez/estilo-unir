import mongoose, { Schema, Document, Model } from 'mongoose';
import { IOutfit } from '@/types/outfit';

export interface IOutfitDocument extends Omit<IOutfit, '_id'>, Document {}

const ContextoSchema = new Schema({
  temperatura: {
    type: Number,
    required: [true, 'La temperatura es obligatoria.']
  },
  lluvia: {
    type: Schema.Types.Mixed,
    required: [true, 'El indicador de lluvia es obligatorio.']
  },
  ocasion: {
    type: String,
    required: [true, 'La ocasión es obligatoria.']
  }
}, { _id: false });

const OutfitSchema = new Schema<IOutfitDocument>({
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  prendas: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Prenda'
    }],
    required: [true, 'Debe incluir al menos 2 prendas para formar un outfit completo.'],
    validate: {
      validator: function(val: any[]) {
        return val && val.length >= 2 && val.length <= 5;
      },
      message: 'Debe incluir al menos 2 prendas para formar un outfit completo'
    }
  },
  contexto: {
    type: ContextoSchema,
    required: true
  },
  justificacionEstilo: {
    type: String,
    required: [true, 'La justificación de estilo es obligatoria.']
  }
}, {
  timestamps: true
});

const Outfit: Model<IOutfitDocument> = mongoose.models.Outfit || mongoose.model<IOutfitDocument>('Outfit', OutfitSchema);
export default Outfit;
