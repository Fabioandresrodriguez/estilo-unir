'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, MicOff, Play, RefreshCw, VolumeX, Volume2 } from 'lucide-react';
import { BottomNav } from '@/components/social/BottomNav';

type AnimState = 'LATENCY' | 'LISTENING' | 'PROCESSING';

export default function RecomendacionHoyPage() {
  const router = useRouter();

  // Estados de control de audio e IA
  const [animState, setAnimState] = useState<AnimState>('LATENCY');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [muteAnimation, setMuteAnimation] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Presiona el botón para iniciar la conversación por voz.');
  const [accessibilityStatus, setAccessibilityStatus] = useState('Conversación de voz inactiva.');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Referencias para Web Audio API y Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processingAngleRef = useRef(0); // Para animar la onda senoidal en "PROCESSING"

  // Iniciar / Detener conversación
  const toggleConversation = async () => {
    if (isConversationActive) {
      stopAudio();
      setIsConversationActive(false);
      setAnimState('LATENCY');
      setStatusMessage('Conversación finalizada.');
      setAccessibilityStatus('Micrófono apagado. Conversación finalizada.');
    } else {
      setIsConversationActive(true);
      setAiResponse(null);
      setStatusMessage('Solicitando acceso al micrófono...');
      setAccessibilityStatus('Solicitando acceso al micrófono...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Inicializar AudioContext
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        setAnimState('LISTENING');
        setStatusMessage('Escuchando tu contexto... (Habla para indicarle a la IA qué harás hoy)');
        setAccessibilityStatus('Micrófono activo. Escuchando tu contexto.');
      } catch (err: any) {
        console.error('Error al acceder al micrófono:', err);
        setIsConversationActive(false);
        setStatusMessage('No se pudo acceder al micrófono. Verifique los permisos.');
        setAccessibilityStatus('Fallo al abrir el micrófono. Permiso denegado.');
      }
    }
  };

  const stopAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  // Simular envío de contexto por voz a la IA
  const simulateAISend = () => {
    if (!isConversationActive) return;

    setAnimState('PROCESSING');
    setStatusMessage('IA procesando tu recomendación de vestidor...');
    setAccessibilityStatus('La inteligencia artificial está procesando tu recomendación.');

    // Simular latencia de red de 3 segundos
    setTimeout(() => {
      setAiResponse(
        '¡Hola! Basado en tu agenda de hoy (Trabajo y luego Social), el clima templado actual y tu guardarropa, te recomiendo usar tu Chamarra Bomber Negra (exterior, repelente), una Camiseta Blanca básica y tus Jeans clásicos. Lograrás un estilo casual perfecto.'
      );
      setAnimState('LATENCY');
      setStatusMessage('Recomendación generada con éxito.');
      setAccessibilityStatus('Recomendación recibida por voz.');
    }, 3000);
  };

  // Dibujar Espectrograma Brutalista
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Limpiar lienzo
      ctx.clearRect(0, 0, width, height);

      // Si la animación está silenciada por accesibilidad, pintar una línea recta brutalista
      if (muteAnimation) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      if (animState === 'LISTENING' && analyserRef.current) {
        // Modo LISTENING: Espectrograma en tiempo real conectado al micrófono
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          // Normalizar el valor
          barHeight = (dataArray[i] / 255) * height * 0.8;

          // Dibujar barras gruesas Brutalistas con bordes negros marcados
          ctx.fillStyle = '#FFFF00'; // Amarillo sólido
          ctx.strokeStyle = '#000000'; // Bordes negros gruesos
          ctx.lineWidth = 2;

          ctx.fillRect(x, height - barHeight, barWidth - 4, barHeight);
          ctx.strokeRect(x, height - barHeight, barWidth - 4, barHeight);

          x += barWidth;
        }
      } else if (animState === 'PROCESSING') {
        // Modo PROCESSING: Onda senoidal rítmica constante (la IA procesa o habla)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.beginPath();

        processingAngleRef.current += 0.08;

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.02 + processingAngleRef.current) * 35;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      } else {
        // Modo LATENCY: Latencia sutil (inactivo / silencio)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const time = Date.now() * 0.003;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.01 + time) * 5; // Onda de latencia muy pequeña
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animState, muteAnimation]);

  // Cleanup general al desmontar
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col min-h-screen bg-[#F3F4F6] border-x-[5px] border-black pb-[64px]">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-[5px] border-black flex items-center justify-between px-4 h-[64px] w-full shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="h-10 w-10 text-black hover:text-gray-600 transition-colors p-0 border-none bg-transparent hover:bg-transparent"
            aria-label="Volver al clóset"
          >
            <ArrowLeft className="size-6 stroke-[2.5px]" />
          </Button>
          <span className="font-heading text-lg tracking-[1px] text-black select-none uppercase">
            Recomendador por Voz
          </span>
        </div>
      </header>

      {/* Región en vivo invisible para lectores de pantallas (WCAG 2.2) */}
      <div className="sr-only" role="status" aria-live="polite">
        {accessibilityStatus}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white p-4 sm:p-6 select-none overflow-y-auto">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
          
          {/* Instrucciones Brutalistas */}
          <div className="border-[3px] border-black p-4 bg-white">
            <h2 className="font-heading text-sm uppercase tracking-wider mb-2">Asistente por Voz</h2>
            <p className="font-mono text-xs text-gray-700 leading-relaxed">
              Presiona iniciar, otorga permisos y pídele tu recomendación personalizada del día hablando.
            </p>
          </div>

          {/* Visualizador de Espectrograma Brutalista */}
          <div 
            className="relative border-[5px] border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4"
            role="region"
            aria-label="Espectrograma de voz activo"
          >
            <div className="flex justify-between items-center border-b-[3px] border-black pb-2">
              <span className="font-heading text-xs uppercase tracking-wider">Visualizador de Voz</span>
              <span className={`font-mono text-xs px-2 py-0.5 border-[2px] border-black ${isConversationActive ? 'bg-[#FFFF00]' : 'bg-[#F0F0F0]'}`}>
                {animState}
              </span>
            </div>

            <div className="border-[3px] border-black bg-[#FAFAFA] overflow-hidden relative">
              <canvas 
                ref={canvasRef} 
                width={500} 
                height={200}
                className="w-full h-[200px] block"
              />
              
              {muteAnimation && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-mono text-xs uppercase tracking-widest border border-dashed border-black">
                  [Animación Silenciada]
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-gray-500 uppercase">
                {statusMessage}
              </span>
              
              {/* Botón Silenciar Animación (Accesibilidad) */}
              <button
                type="button"
                onClick={() => setMuteAnimation(!muteAnimation)}
                className="border-[2px] border-black p-1.5 hover:bg-[#F0F0F0] transition-colors flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold shrink-0 cursor-pointer"
                title={muteAnimation ? "Activar animación" : "Silenciar animación"}
                aria-label={muteAnimation ? "Activar animación del espectrograma" : "Silenciar animación del espectrograma"}
              >
                {muteAnimation ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                {muteAnimation ? "Animar" : "Silenciar"}
              </button>
            </div>
          </div>

          {/* Acciones e Interacción */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={toggleConversation}
                variant={isConversationActive ? 'secondary' : 'default'}
                className="flex-1 py-6 flex items-center justify-center gap-3"
              >
                {isConversationActive ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                {isConversationActive ? 'Detener Conversación' : 'Iniciar conversación por voz'}
              </Button>

              {isConversationActive && animState === 'LISTENING' && (
                <Button
                  onClick={simulateAISend}
                  variant="default"
                  className="bg-[#FFFF00] text-black border-black hover:bg-black hover:text-white flex-1 py-6 flex items-center justify-center gap-3"
                >
                  <Play className="size-5" />
                  Enviar Voz (Simular)
                </Button>
              )}
            </div>
          </div>

          {/* Panel de Respuesta de la IA */}
          {aiResponse && (
            <div className="border-[5px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex justify-between items-center border-b-[3px] border-black pb-2 mb-4">
                <span className="font-heading text-xs uppercase tracking-wider">Recomendación del Vestidor</span>
                <span className="font-mono text-xs font-bold text-[#008000]">[OK]</span>
              </div>
              <p className="font-mono text-sm leading-relaxed text-black">
                {aiResponse}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Navigation */}
      <BottomNav />
    </div>
  );
}
