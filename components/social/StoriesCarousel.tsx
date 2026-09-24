import { Users, Plus } from "lucide-react";
import Link from "next/link";

export function StoriesCarousel() {
  const stories = [
    {
      id: "comunidad",
      label: "Comunidad",
      isCommunity: true,
      bg: "bg-black text-white",
      border: "border-black",
    },
    {
      id: "fits",
      label: "fits",
      initials: "FT",
      bg: "bg-yellow-400 text-black",
      border: "border-black",
    },
    {
      id: "zanzi",
      label: "zanzi",
      initials: "ZZ",
      bg: "bg-purple-500 text-white",
      border: "border-black",
    },
    {
      id: "style_bot",
      label: "AI.Style",
      initials: "AI",
      bg: "bg-green-500 text-black",
      border: "border-black",
    },
    {
      id: "denim_girl",
      label: "denim_g",
      initials: "DG",
      bg: "bg-pink-500 text-white",
      border: "border-black",
    },
    {
      id: "retro_boy",
      label: "retro_b",
      initials: "RB",
      bg: "bg-cyan-500 text-black",
      border: "border-black",
    },
  ];

  return (
    <div className="w-full bg-white border-b-[5px] border-black py-4 px-4 overflow-hidden">
      <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {stories.map((story) => {
          if (story.isCommunity) {
            return (
              <div
                key={story.id}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start select-none cursor-pointer group"
              >
                <div
                  className={`size-16 rounded-full rounded-circle border-[3px] ${story.border} ${story.bg} flex items-center justify-center transition-transform active:scale-95 duration-100`}
                >
                  <Users className="size-7" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-[0.5px] text-black group-hover:underline">
                  {story.label}
                </span>
              </div>
            );
          }

          return (
            <div
              key={story.id}
              className="flex flex-col items-center gap-1.5 shrink-0 snap-start select-none cursor-pointer group"
            >
              <div
                className={`size-16 rounded-full rounded-circle border-[3px] ${story.border} ${story.bg} flex items-center justify-center transition-transform active:scale-95 duration-100`}
              >
                <span className="font-heading text-lg select-none">
                  {story.initials}
                </span>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-[0.5px] text-black group-hover:underline">
                {story.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
