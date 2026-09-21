export type EstadoPrenda = 'Disponible' | 'Sucio' | 'Lavandería';

export type CategoriaPrenda = 'Superior' | 'Inferior' | 'Entero' | 'Calzado' | 'Accesorios';

export type SubcategoriaPrenda = 
  // Superior
  | 'Camiseta' | 'Camisa' | 'Hoodie' | 'Chamarra' | 'Suéter' | 'Top'
  // Inferior
  | 'Jeans' | 'Pantalón' | 'Shorts' | 'Cargo' | 'Joggers' | 'Falda'
  // Entero
  | 'Vestido' | 'Mono' | 'Overol'
  // Calzado
  | 'Sneakers' | 'Botas' | 'Zapatos Formales' | 'Sandalias'
  // Accesorios
  | 'Gorra' | 'Bufanda' | 'Cinturón' | 'Lentes' | 'Mochila' | 'Bolso';

export type ColorBase = 
  | 'Negro' | 'Blanco' | 'Gris' | 'Azul Marino' | 'Azul Claro' 
  | 'Beige' | 'Café' | 'Verde Oliva' | 'Burdeos' | 'Rojo' 
  | 'Amarillo' | 'Verde' | 'Rosa';

export type EstacionClima = 'Primavera' | 'Verano' | 'Otoño' | 'Invierno' | 'Todo el año';

export type EstiloPrenda = 'Casual' | 'Formal' | 'Deportivo' | 'Streetwear' | 'Oficina' | 'Fiesta';

export interface IMetadataPrenda {
  categoria: CategoriaPrenda;
  subcategoria: SubcategoriaPrenda;
  colores: ColorBase[];
  estaciones: EstacionClima[];
  estilo: EstiloPrenda[];
  talla: string;
  notas?: string;
}

export interface IPrenda {
  _id?: string;
  nombre: string;
  imagenes: string[];
  estado: EstadoPrenda;
  metadata: IMetadataPrenda;
  createdAt?: Date;
  updatedAt?: Date;
}
