import { Sparkles, ThumbsDown, ThumbsUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AiStylist() {
  const models1 = [
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600',
  ];

  const model2 = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600';

  return (
    <div className="w-full flex flex-col gap-4 py-2">
      {/* Sección Título */}
      <div className="px-4 flex items-center gap-2">
        <Sparkles className="size-5 text-black" />
        <h3 className="text-xl sm:text-2xl font-heading font-normal uppercase m-0 text-black">
          Estilista AI
        </h3>
      </div>

      {/* Contenedor Scroll Horizontal */}
      <div className="w-full overflow-x-auto scrollbar-none snap-x snap-mandatory flex gap-6 px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Card 1: Crear un conjunto */}
        <div className="snap-start shrink-0 w-[85vw] sm:w-[500px] border-[5px] border-black bg-white p-6 flex flex-col gap-6 select-none">
          <div className="flex flex-col gap-2">
            <h4 className="text-2xl font-heading font-normal uppercase leading-none text-black">
              Crear un conjunto
            </h4>
            <p className="font-sans text-sm text-gray-500 font-medium">
              Para cualquier fecha, ocasión y estilo
            </p>
          </div>

          {/* Grid de 3 Modelos */}
          <div className="grid grid-cols-3 gap-3 border-[3px] border-black p-2 bg-gray-100">
            {models1.map((url, idx) => (
              <div key={idx} className="relative aspect-[3/4] border-[2px] border-black overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={url} 
                  alt={`Modelo de estilo ${idx + 1}`}
                  className="object-cover w-full h-full filter grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>

          {/* Botón de Acción Brutalista */}
          <Button variant="default" className="w-full py-3 text-xs tracking-[2px] font-mono font-bold uppercase border-[3px] border-black bg-black text-white hover:bg-white hover:text-black transition-colors">
            Generar OOTD con IA
          </Button>
        </div>

        {/* Card 2: Califica mi conjunto (Parcialmente visible off-screen) */}
        <div className="snap-start shrink-0 w-[85vw] sm:w-[500px] border-[5px] border-black bg-white p-6 flex flex-col gap-6 select-none">
          <div className="flex flex-col gap-2">
            <h4 className="text-2xl font-heading font-normal uppercase leading-none text-black">
              Califica mi conjunto
            </h4>
            <p className="font-sans text-sm text-gray-500 font-medium">
              Obtén feedback instantáneo y entrena a tu estilista personal
            </p>
          </div>

          {/* Modelo y Controles */}
          <div className="relative aspect-[16/9] border-[3px] border-black overflow-hidden bg-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={model2} 
              alt="Modelo a calificar"
              className="object-cover w-full h-full filter grayscale hover:grayscale-0 transition-all duration-300"
            />
            {/* Overlay de calificación */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-4">
              <span className="font-mono text-xs text-white uppercase bg-black px-2 py-1 border border-white">
                Casual / Streetwear
              </span>
              <div className="flex gap-2">
                <button 
                  className="bg-white hover:bg-red-500 hover:text-white text-black p-2 border-[2px] border-black transition-colors flex items-center justify-center" 
                  aria-label="No me gusta"
                >
                  <ThumbsDown className="size-4" />
                </button>
                <button 
                  className="bg-white hover:bg-green-500 hover:text-white text-black p-2 border-[2px] border-black transition-colors flex items-center justify-center" 
                  aria-label="Me gusta"
                >
                  <ThumbsUp className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Botón de Acción Brutalista */}
          <Button variant="secondary" className="w-full py-3 text-xs tracking-[2px] font-mono font-bold uppercase border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-colors">
            Escanear Mi Conjunto Actual
          </Button>
        </div>

      </div>
    </div>
  );
}
