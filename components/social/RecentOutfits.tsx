import { Plus } from 'lucide-react';

export function RecentOutfits() {
  const outfits = [
    {
      id: 1,
      title: 'STREET MINIMAL',
      date: 'HOY - 21 JUN',
      modelUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600',
      items: [
        { name: 'Polera Oversize', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300' },
        { name: 'Pantalón Cargo', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=300' }
      ]
    },
    {
      id: 2,
      title: 'URBAN UTILITY',
      date: 'AYER - 20 JUN',
      modelUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600',
      items: [
        { name: 'Chaqueta Cortaviento', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=300' },
        { name: 'Zapatillas Retro', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=300' }
      ]
    },
    {
      id: 3,
      title: 'NOCTURNO COZY',
      date: '18 JUN',
      modelUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600',
      items: [
        { name: 'Gorro Beanie', url: 'https://images.unsplash.com/photo-1576871337622-98d48d435350?q=80&w=300' },
        { name: 'Polerón Negro', url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300' }
      ]
    }
  ];

  return (
    <div className="w-full flex flex-col gap-4 px-4 py-4 mb-16">
      {/* Título de Sección */}
      <div>
        <h3 className="text-xl sm:text-2xl font-heading font-normal uppercase m-0 text-black">
          Conjuntos Recientes
        </h3>
        <p className="font-mono text-[10px] text-gray-500 uppercase">
          [COMBINACIONES DE GUARDARROPA REGISTRADAS]
        </p>
      </div>

      {/* Stack de Tarjetas Superpuestas */}
      <div className="relative flex flex-col sm:flex-row gap-6 mt-2">
        {outfits.map((outfit, index) => (
          <div 
            key={outfit.id}
            className="w-full sm:w-[340px] bg-white border-[4px] border-black p-4 flex flex-col gap-4 transition-all hover:-translate-y-2 hover:translate-x-1 duration-200 select-none z-10"
            style={{
              // Let's create an overlapping card deck feeling on desktop using negative margins,
              // or let them layout naturally on mobile.
              marginRight: index < outfits.length - 1 ? '-20px' : '0px',
            }}
          >
            {/* Cabecera Tarjeta */}
            <div className="flex justify-between items-center border-b-[2px] border-black pb-2">
              <span className="font-heading text-sm text-black">
                {outfit.title}
              </span>
              <span className="font-mono text-[10px] bg-black text-white px-2 py-0.5 border border-black">
                {outfit.date}
              </span>
            </div>

            {/* Mezcla Visual: Modelo (grande) + Prendas Catálogo (pequeñas, superpuestas) */}
            <div className="relative aspect-[4/3] w-full border-[2px] border-black overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={outfit.modelUrl} 
                alt={outfit.title}
                className="object-cover w-full h-full filter grayscale hover:grayscale-0 transition-all duration-300"
              />

              {/* Prendas del Catálogo Overlaid */}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                {outfit.items.map((item, itemIdx) => (
                  <div 
                    key={itemIdx} 
                    className="size-14 bg-white border-[2px] border-black p-0.5 flex items-center justify-center relative group/item"
                    title={item.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.url} 
                      alt={item.name}
                      className="object-cover w-full h-full filter grayscale hover:grayscale-0 transition-all duration-150"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
