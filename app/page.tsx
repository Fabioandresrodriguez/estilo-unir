import { HeaderBar } from '@/components/social/HeaderBar';
import { StoriesCarousel } from '@/components/social/StoriesCarousel';
import { AiStylist } from '@/components/social/AiStylist';
import { ShortcutsGrid } from '@/components/social/ShortcutsGrid';
import { RecentOutfits } from '@/components/social/RecentOutfits';
import { BottomNav } from '@/components/social/BottomNav';

export default function Home() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-h-screen bg-[#F3F4F6] border-x-[5px] border-black pb-[64px]">
      {/* Header */}
      <HeaderBar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 bg-white">
        {/* Stories Carousel */}
        <StoriesCarousel />
        
        {/* AI Stylist */}
        <AiStylist />
        
        {/* Atajos */}
        <ShortcutsGrid />
        
        {/* Recent Outfits */}
        <RecentOutfits />

        {/* Footer Técnico */}
        <div className="mx-4 mt-8 mb-8 border-t-[3px] border-black pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <span className="font-mono text-[10px] text-gray-400">
            PROYECTO: CLÓSET DIGITAL MVP // ESTILO: RAWBLOCK BRUTALISTA // ESTADO: HU5 IMPLEMENTADO
          </span>
          <span className="font-mono text-[10px] text-gray-400">
            HECHO EN 2026 // NEXT.JS 16 & REACT 19
          </span>
        </div>
      </main>

      {/* Fixed Navigation */}
      <BottomNav />
    </div>
  );
}
