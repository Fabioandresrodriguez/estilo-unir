import { Types } from 'mongoose';

export interface IOutfitContext {
  temperatura: number;
  lluvia: boolean | number;
  ocasion: string;
}

export interface IOutfit {
  _id?: string;
  fecha: Date;
  prendas: (Types.ObjectId | string)[]; // 2 a 5 prendas
  contexto: IOutfitContext;
  justificacionEstilo: string;
  createdAt?: Date;
  updatedAt?: Date;
}
