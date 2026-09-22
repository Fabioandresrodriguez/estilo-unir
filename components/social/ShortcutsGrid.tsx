import Link from 'next/link';
import { Calendar, Accessibility, Sparkles, Camera } from 'lucide-react';

export function ShortcutsGrid() {
  const shortcuts = [
    {
      label: 'Planificador',
      icon: Calendar,
      href: '/prendas/consola',
      color: 'bg-[#F3F4F6]',
    },
    {
      label: 'Vestidor',
      icon: Accessibility,
      href: '/prendas/vestidor',
      color: 'bg-[#F3F4F6]',
    },
    {
      label: 'Prueba con IA',
      icon: Sparkles,
      href: '#',
      color: 'bg-[#F3F4F6]',
    },
    {
      label: 'Selfie',
      icon: Camera,
      href: '/prendas/registrar',
      color: 'bg-[#F3F4F6]',
    },
  ];

  return (
    <div className="w-full px-4 py-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {shortcuts.map((shortcut, idx) => {
          const Icon = shortcut.icon;
          return (
            <Link 
              key={idx}
              href={shortcut.href}
              className={`flex flex-col items-center justify-center p-4 border-[3px] border-black ${shortcut.color} transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:-translate-x-[2px] hover:-translate-y-[2px] cursor-pointer text-black select-none group`}
            >
              <div className="p-2 border-[2px] border-black bg-white group-hover:bg-black group-hover:text-white transition-colors mb-2">
                <Icon className="size-6 stroke-[2.5px]" />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.5px] font-bold text-center">
                {shortcut.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
