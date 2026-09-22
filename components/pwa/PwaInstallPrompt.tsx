'use client';

import { useState, useEffect } from 'react';
import { Download, X, HelpCircle, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Register Service Worker for PWA compliance (only in production to avoid dev HMR loops)
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        const registerSW = () => {
          navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('Service Worker registered:', reg.scope))
            .catch((err) => console.error('Service Worker registration failed:', err));
        };

        if (document.readyState === 'complete') {
          registerSW();
        } else {
          window.addEventListener('load', registerSW);
        }
      } else {
        // Active unregistration in development to clean up any cached state causing loops
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('Dev Service Worker unregistered successfully.');
              }
            });
          }
        });
      }
    }

    // Detect if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      // @ts-ignore - Support for legacy iOS devices
      const isIOSStandalone = window.navigator.standalone === true;
      return isStandaloneMedia || isIOSStandalone;
    };

    setIsStandalone(checkStandalone());

    // Check if dismissed previously
    const dismissed = localStorage.getItem('pwa_installation_dismissed') === 'true';
    setIsDismissed(dismissed);

    // Detect iOS to show specific instructions
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIpadOrIphone = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIpadOrIphone);

    // Listen to beforeinstallprompt event for Android/Chrome/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!mounted || isStandalone || isDismissed) {
    return null;
  }

  // Only show prompt if beforeinstallprompt is available OR if it's iOS
  // (Since iOS doesn't support beforeinstallprompt, we show a generic help banner)
  const shouldShow = deferredPrompt !== null || isIOS;

  if (!shouldShow) {
    return null;
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser's install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // Clear the deferred prompt variable
      setDeferredPrompt(null);
    }
  };

  const handleDismissForever = () => {
    localStorage.setItem('pwa_installation_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleCloseSession = () => {
    setIsDismissed(true); // Ocultar por la sesión actual
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[400px] bg-[#FFE600] border-[4px] border-black shadow-[6px_6px_0px_0px_#000000] p-5 z-50 select-none animate-in fade-in slide-in-from-bottom-10 duration-300">
      {/* Botón Cerrar (Esquina superior derecha) */}
      <button 
        onClick={handleCloseSession}
        className="absolute top-2 right-2 p-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition-colors"
        aria-label="Cerrar sugerencia"
      >
        <X className="size-4" />
      </button>

      <div className="flex gap-4 items-start">
        <div className="bg-black p-2 text-white border-[2px] border-black flex-shrink-0">
          <Smartphone className="size-6" />
        </div>
        <div className="flex-1 pr-6">
          <h4 className="font-heading text-base tracking-[0.5px] uppercase text-black leading-tight mb-1">
            Instalar App
          </h4>
          <p className="font-mono text-[12px] text-black leading-snug mb-3">
            Agrega Clóset Digital a tu pantalla de inicio para una experiencia de pantalla completa y acceso offline.
          </p>

          {isIOS ? (
            <div className="bg-white border-[2px] border-black p-2 mb-3 text-[11px] font-mono text-black leading-tight">
              <span className="font-bold">Para instalar en iOS:</span>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Presiona el botón de compartir (<span className="font-sans">⎙</span> / Compartir).</li>
                <li>Selecciona <span className="font-bold">"Agregar a inicio"</span>.</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-white hover:text-black border-[3px] border-black py-2 px-4 font-heading text-xs uppercase tracking-[0.5px] transition-all active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Download className="size-4" />
              Instalar Directo
            </button>
          )}

          <div className="mt-2 text-right">
            <button
              onClick={handleDismissForever}
              className="font-mono text-[10px] uppercase font-bold text-black/80 hover:text-black underline decoration-dotted"
            >
              No volver a sugerir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
