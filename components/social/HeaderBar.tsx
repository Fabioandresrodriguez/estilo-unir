import { Shirt, Sparkles, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeaderBar() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b-[5px] border-black flex items-center justify-between px-4 sm:px-6 h-[64px] w-full">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-black p-1 text-white border-[2px] border-black flex items-center justify-center">
          <Shirt className="size-5" />
        </div>
        <span className="font-heading text-xl tracking-[1px] text-black select-none">
          Estilo
        </span>
      </div>
    </header>
  );
}
