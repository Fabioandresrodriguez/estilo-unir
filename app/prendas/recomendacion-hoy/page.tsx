'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  VolumeX, 
  Volume2, 
  AlertTriangle,
  Send,
  HelpCircle
} from 'lucide-react';
import { BottomNav } from '@/components/social/BottomNav';

type AnimState = 'LATENCY' | 'LISTENING' | 'PROCESSING';
type ClimaOption = 'Frío' | 'Fresco' | 'Templado' | 'Cálido';
type OcasionOption = 'Trabajo' | 'Deporte' | 'Social' | 'Formal' | 'Hogar' | 'Playa';

export default function RecomendacionHoyPage() {
  const router = useRouter();

  // Estados del Espectrograma e IA
  const [animState, setAnimState] = useState<AnimState>('LATENCY');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [muteAnimation, setMuteAnimation] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Presiona el botón para iniciar la conversación por voz.');
  const [accessibilityStatus, setAccessibilityStatus] = useState('Conversación de voz inactiva.');
  
  // Transcripción y variables del contexto de vestimenta
  const [transcription, setTranscription] = useState('');
  const [selectedClima, setSelectedClima] = useState<ClimaOption>('Templado');
  const [selectedOcasion, setSelectedOcasion] = useState<OcasionOption>('Social');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Web Speech API - Compatibilidad
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);

  // TTS (Text-to-Speech) - Estados de reproducción
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isTtsPaused, setIsTtsPaused] = useState(false);

  // Referencias de audio y canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processingAngleRef = useRef(0);

  // Referencia a SpeechRecognition
  const recognitionRef = useRef<any>(null);

  // Inicializar compatibilidad de reconocimiento de voz
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      setShowManualFallback(true);
      setStatusMessage('Reconocimiento de voz no soportado en este navegador. Use la entrada manual.');
    } else {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'es-MX';

      rec.onstart = () => {
        setAnimState('LISTENING');
        setStatusMessage('Escuchando tu voz... Di clima, ocasión o lo que harás hoy.');
        setAccessibilityStatus('Micrófono activo. Escuchando.');
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscription(currentText);

        // Compilar dinámicamente variables basadas en palabras clave (Escenario 1)
        analyzeKeywords(currentText);
      };

      rec.onerror = (event: any) => {
        console.error('Error de SpeechRecognition:', event.error);
        setSpeechError(`Error de voz: ${event.error}. Activando fallback manual.`);
        setShowManualFallback(true);
        stopAudioAndSpeech();
      };

      rec.onend = () => {
        setIsConversationActive(false);
        // Si hay una transcripción válida, procesar recomendación
        if (transcription.trim().length > 3) {
          handleFetchRecommendation();
        } else {
          setAnimState('LATENCY');
          setStatusMessage('Conversación de voz pausada.');
          setAccessibilityStatus('Micrófono desactivado.');
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopAudioAndSpeech();
    };
  }, [transcription]);

  // Analizar palabras clave en tiempo real
  const analyzeKeywords = (text: string) => {
    const cleanText = text.toLowerCase();

    // 1. Detección de Clima
    if (cleanText.includes('frío') || cleanText.includes('helado') || cleanText.includes('invierno') || cleanText.includes('baja temperatura')) {
      setSelectedClima('Frío');
    } else if (cleanText.includes('fresco') || cleanText.includes('viento') || cleanText.includes('otoño')) {
      setSelectedClima('Fresco');
    } else if (cleanText.includes('calor') || cleanText.includes('caliente') || cleanText.includes('verano') || cleanText.includes('sol')) {
      setSelectedClima('Cálido');
    } else if (cleanText.includes('templado') || cleanText.includes('agradable') || cleanText.includes('primavera')) {
      setSelectedClima('Templado');
    }

    // 2. Detección de Ocasión / Estilo
    if (cleanText.includes('trabajo') || cleanText.includes('oficina') || cleanText.includes('junta') || cleanText.includes('negocios')) {
      setSelectedOcasion('Trabajo');
    } else if (cleanText.includes('deporte') || cleanText.includes('ejercicio') || cleanText.includes('correr') || cleanText.includes('entrenar')) {
      setSelectedOcasion('Deporte');
    } else if (cleanText.includes('fiesta') || cleanText.includes('social') || cleanText.includes('amigos') || cleanText.includes('salida')) {
      setSelectedOcasion('Social');
    } else if (cleanText.includes('formal') || cleanText.includes('boda') || cleanText.includes('gala') || cleanText.includes('elegante')) {
      setSelectedOcasion('Formal');
    } else if (cleanText.includes('hogar') || cleanText.includes('casa') || cleanText.includes('descanso') || cleanText.includes('pijama')) {
      setSelectedOcasion('Hogar');
    } else if (cleanText.includes('playa') || cleanText.includes('alberca') || cleanText.includes('piscina') || cleanText.includes('calor extremo')) {
      setSelectedOcasion('Playa');
    }
  };

  // Iniciar / Detener grabación
  const toggleSpeechConversation = async () => {
    if (isConversationActive) {
      stopAudioAndSpeech();
    } else {
      setIsConversationActive(true);
      setAiResponse(null);
      setTranscription('');
      setSpeechError(null);
      
      // Detener cualquier síntesis activa anterior
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsTtsPlaying(false);
      setIsTtsPaused(false);

      // Iniciar el Analizador del espectrograma
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        setAnimState('LISTENING');

        // Iniciar reconocimiento de voz
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (err: any) {
        console.error('Error al iniciar recursos de voz:', err);
        setSpeechError('Permiso de micrófono denegado o no disponible.');
        setShowManualFallback(true);
        stopAudioAndSpeech();
      }
    }
  };

  const stopAudioAndSpeech = () => {
    setIsConversationActive(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
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
    setAnimState('LATENCY');
  };

  // Generar recomendación dinámicamente conectando con la base de datos local
  const handleFetchRecommendation = async () => {
    setAnimState('PROCESSING');
    setStatusMessage('Procesando recomendación en base a tu clóset...');
    setAccessibilityStatus('IA procesando tu recomendación de vestidor.');

    try {
      // Intentar obtener las prendas registradas en MongoDB
      const res = await fetch('/api/prendas?limit=100');
      const responseData = await res.json();
      const prendas = responseData.data || [];

      // Lógica de recomendación simple en el cliente
      // Filtrar prendas según el clima y ocasión solicitada
      const superiores = prendas.filter((p: any) => p.metadata.categoria === 'Superior');
      const inferiores = prendas.filter((p: any) => p.metadata.categoria === 'Inferior');
      const calzados = prendas.filter((p: any) => p.metadata.categoria === 'Calzado');

      // Buscar prendas adecuadas al clima
      let prendaSuperior = superiores[0];
      let prendaInferior = inferiores[0];
      let calzado = calzados[0];

      if (selectedClima === 'Frío') {
        // Buscar abrigos o chamarras pesadas
        prendaSuperior = superiores.find((p: any) => 
          p.metadata.subcategoria === 'Chamarra' || 
          p.metadata.subcategoria === 'Suéter' || 
          p.metadata.subcategoria === 'Hoodie' ||
          (p.metadata.climaClo && p.metadata.climaClo > 0.4)
        ) || superiores[0];
      } else if (selectedClima === 'Cálido') {
        // Buscar camisetas o tops ligeros
        prendaSuperior = superiores.find((p: any) => 
          p.metadata.subcategoria === 'Camiseta' || 
          p.metadata.subcategoria === 'Top'
        ) || superiores[0];
      }

      // Buscar prenda inferior combinada
      if (selectedOcasion === 'Deporte') {
        prendaInferior = inferiores.find((p: any) => 
          p.metadata.subcategoria === 'Joggers' || 
          p.metadata.subcategoria === 'Shorts'
        ) || inferiores[0];
        calzado = calzados.find((p: any) => p.metadata.subcategoria === 'Sneakers') || calzados[0];
      } else if (selectedOcasion === 'Formal') {
        prendaInferior = inferiores.find((p: any) => p.metadata.subcategoria === 'Pantalón') || inferiores[0];
        calzado = calzados.find((p: any) => p.metadata.subcategoria === 'Zapatos Formales') || calzados[0];
      }

      // Formular la justificación del conjunto (TTS compatible)
      let recText = '';
      if (prendaSuperior && prendaInferior) {
        recText = `He seleccionado un conjunto ideal para un clima ${selectedClima} y una ocasión de tipo ${selectedOcasion}. Te recomiendo vestir tu superior "${prendaSuperior.nombre}" combinada con tu prenda inferior "${prendaInferior.nombre}". `;
        if (calzado) {
          recText += `Como calzado, sugiero tus "${calzado.nombre}" para mantener la comodidad y el estilo correcto. `;
        }
        recText += `Esta combinación te mantendrá en la temperatura perfecta y se ajustará de manera ideal al contexto de hoy.`;
      } else {
        // Fallback genérico si no hay prendas en la base de datos
        recText = `He analizado tu contexto de hoy para clima ${selectedClima} y ocasión ${selectedOcasion}. Te recomiendo vestir una chamarra abrigadora con unos jeans oscuros y tus sneakers favoritos. Esta elección te proveerá el aislamiento necesario y un estilo casual ideal para el día de hoy.`;
      }

      // Dar feedback
      setTimeout(() => {
        setAiResponse(recText);
        setAnimState('LATENCY');
        setStatusMessage('Recomendación de vestidor completada.');
        setAccessibilityStatus('Recomendación generada. Iniciando lectura en voz alta.');
        
        // Disparar Text-to-Speech (Escenario 2)
        speakText(recText);
      }, 2000);

    } catch (err) {
      console.error('Error al generar recomendación:', err);
      setAnimState('LATENCY');
      setStatusMessage('Ocurrió un error al consultar el guardarropa.');
    }
  };

  // Text-To-Speech (Síntesis de Voz)
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    // Detener cualquier reproducción en curso
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX'; // Idioma configurado explícitamente (Regla de negocio)
    
    utterance.onstart = () => {
      setIsTtsPlaying(true);
      setIsTtsPaused(false);
    };

    utterance.onend = () => {
      setIsTtsPlaying(false);
      setIsTtsPaused(false);
    };

    utterance.onerror = () => {
      setIsTtsPlaying(false);
      setIsTtsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTtsPause = () => {
    if (window.speechSynthesis && isTtsPlaying) {
      window.speechSynthesis.pause();
      setIsTtsPaused(true);
    }
  };

  const handleTtsResume = () => {
    if (window.speechSynthesis && isTtsPaused) {
      window.speechSynthesis.resume();
      setIsTtsPaused(false);
    }
  };

  const handleTtsStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      setIsTtsPaused(false);
    }
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

      ctx.clearRect(0, 0, width, height);

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
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height * 0.8;
          ctx.fillStyle = '#FFFF00';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;

          ctx.fillRect(x, height - barHeight, barWidth - 4, barHeight);
          ctx.strokeRect(x, height - barHeight, barWidth - 4, barHeight);

          x += barWidth;
        }
      } else if (animState === 'PROCESSING') {
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
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const time = Date.now() * 0.003;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.01 + time) * 5;
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
            Recomendador de Outfits
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
          
          {/* Advertencia de Fallback (Escenario 3) */}
          {speechError && (
            <div className="border-[3px] border-[#FF0000] p-4 text-[#FF0000] bg-white font-mono text-xs uppercase flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Visualizador de Espectrograma Brutalista */}
          <div 
            className="relative border-[5px] border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4"
            role="region"
            aria-label="Espectrograma de voz activo"
          >
            <div className="flex justify-between items-center border-b-[3px] border-black pb-2">
              <span className="font-heading text-xs uppercase tracking-wider">Espectrograma de Voz</span>
              <span className={`font-mono text-xs px-2 py-0.5 border-[2px] border-black ${isConversationActive ? 'bg-[#FFFF00]' : 'bg-[#F0F0F0]'}`}>
                {animState}
              </span>
            </div>

            <div className="border-[3px] border-black bg-[#FAFAFA] overflow-hidden relative">
              <canvas 
                ref={canvasRef} 
                width={500} 
                height={150}
                className="w-full h-[150px] block"
              />
              
              {muteAnimation && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-mono text-xs uppercase tracking-widest border border-dashed border-black">
                  [Animación Silenciada]
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-gray-500 uppercase leading-snug">
                {statusMessage}
              </span>
              
              {/* Botón Silenciar Animación (Accesibilidad) */}
              <button
                type="button"
                onClick={() => setMuteAnimation(!muteAnimation)}
                className="border-[2px] border-black p-1.5 hover:bg-[#F0F0F0] transition-colors flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold shrink-0 cursor-pointer"
                title={muteAnimation ? "Activar animación" : "Silenciar animación"}
                aria-label={muteAnimation ? "Activar animación" : "Silenciar animación"}
              >
                {muteAnimation ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                {muteAnimation ? "Animar" : "Silenciar"}
              </button>
            </div>
          </div>

          {/* Caja de Transcripción y Texto */}
          <div className="border-[3px] border-black bg-white p-4 flex flex-col gap-3">
            <label className="font-heading text-xs uppercase tracking-wider block">
              Transcripción en Tiempo Real / Consulta escrita
            </label>
            <textarea
              value={transcription}
              onChange={(e) => {
                setTranscription(e.target.value);
                analyzeKeywords(e.target.value);
              }}
              placeholder="Presiona 'Iniciar voz' y habla, o ingresa tu contexto manualmente aquí..."
              className="bg-[#F0F0F0] text-black border-[3px] border-black p-3 font-mono text-sm focus:border-[5px] focus:outline-none w-full min-h-[90px] rounded-none resize-y"
            />
          </div>

          {/* Controles de Voz */}
          <div className="flex flex-col sm:flex-row gap-3">
            {speechSupported && (
              <Button
                onClick={toggleSpeechConversation}
                variant={isConversationActive ? 'secondary' : 'default'}
                className="flex-1 py-6 flex items-center justify-center gap-3"
              >
                {isConversationActive ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                {isConversationActive ? 'Detener Voz' : 'Iniciar conversación por voz'}
              </Button>
            )}

            <Button
              onClick={handleFetchRecommendation}
              disabled={transcription.trim().length === 0 || animState === 'PROCESSING'}
              className="bg-[#FFFF00] text-black border-black hover:bg-black hover:text-white flex-1 py-6 flex items-center justify-center gap-3"
            >
              <Send className="size-5" />
              Pedir Recomendación
            </Button>
          </div>

          {/* Controles de Fallback Manual (Chips de Clima y Ocasión - Escenario 3) */}
          <div className="border-[3px] border-black p-4 bg-white flex flex-col gap-4">
            <span className="font-heading text-xs uppercase tracking-wider block border-b-[2px] border-black pb-2">
              Ajuste de Variables (Chips de Fallback Manual)
            </span>

            {/* Chips de Clima */}
            <div>
              <span className="font-mono text-[11px] text-gray-500 uppercase block mb-2">Clima:</span>
              <div className="flex flex-wrap gap-2">
                {(['Frío', 'Fresco', 'Templado', 'Cálido'] as ClimaOption[]).map((clima) => (
                  <button
                    key={clima}
                    type="button"
                    onClick={() => setSelectedClima(clima)}
                    className={`border-[2px] border-black px-3 py-1.5 font-mono uppercase text-[10px] tracking-[1px] cursor-pointer transition-colors ${selectedClima === clima ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F0F0F0]'}`}
                  >
                    {clima}
                  </button>
                ))}
              </div>
            </div>

            {/* Chips de Ocasión */}
            <div>
              <span className="font-mono text-[11px] text-gray-500 uppercase block mb-2">Ocasión:</span>
              <div className="flex flex-wrap gap-2">
                {(['Trabajo', 'Deporte', 'Social', 'Formal', 'Hogar', 'Playa'] as OcasionOption[]).map((ocasion) => (
                  <button
                    key={ocasion}
                    type="button"
                    onClick={() => setSelectedOcasion(ocasion)}
                    className={`border-[2px] border-black px-3 py-1.5 font-mono uppercase text-[10px] tracking-[1px] cursor-pointer transition-colors ${selectedOcasion === ocasion ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F0F0F0]'}`}
                  >
                    {ocasion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de Respuesta y Reproducción TTS (Escenario 2) */}
          {aiResponse && (
            <div className="border-[5px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex justify-between items-center border-b-[3px] border-black pb-2">
                <span className="font-heading text-xs uppercase tracking-wider">Propuesta del Asistente</span>
                <span className="font-mono text-xs font-bold text-[#008000]">[OK]</span>
              </div>
              
              <p className="font-mono text-sm leading-relaxed text-black bg-[#F9F9F9] p-3 border-[2px] border-black">
                {aiResponse}
              </p>

              {/* Controles de Audio Brutalistas para TTS (Text-to-Speech) */}
              <div className="flex flex-wrap gap-2 items-center justify-end border-t-[2px] border-black pt-3">
                <span className="font-mono text-[10px] text-gray-500 uppercase mr-auto">
                  {isTtsPlaying ? (isTtsPaused ? "Lectura pausada" : "Leyendo en voz alta...") : "Audio listo"}
                </span>

                {isTtsPlaying && !isTtsPaused ? (
                  <Button
                    onClick={handleTtsPause}
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs font-mono uppercase"
                  >
                    <Pause className="size-3.5 mr-1" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    onClick={isTtsPaused ? handleTtsResume : () => speakText(aiResponse)}
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs font-mono uppercase"
                  >
                    <Play className="size-3.5 mr-1" />
                    {isTtsPaused ? "Reanudar" : "Escuchar"}
                  </Button>
                )}

                {(isTtsPlaying || isTtsPaused) && (
                  <Button
                    onClick={handleTtsStop}
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs font-mono uppercase"
                  >
                    <Square className="size-3.5 mr-1" />
                    Detener
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Navigation */}
      <BottomNav />
    </div>
  );
}
