'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Cámara trasera en móviles por defecto
          audio: false
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('No se pudo acceder a la cámara:', err);
        setError('No se pudo acceder a la cámara del dispositivo. Verifique los permisos.');
      }
    }
    startCamera();

    // Keyboard listener for Escape key to close the camera modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup: Detener cámara al desmontar y limpiar event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onClose]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            onCapture(blob, previewUrl);
          }
        }, 'image/jpeg', 0.85);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error ? (
        <div className="border-[3px] border-[#FF0000] p-4 text-[#FF0000] font-mono text-sm bg-white w-full text-center">
          {error}
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden border-[3px] border-black bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="h-full w-full object-cover" 
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {!error && (
          <Button 
            onClick={capturePhoto} 
            type="button" 
            variant="default"
            className="w-full"
          >
            Capturar Fotografía
          </Button>
        )}
        <Button 
          onClick={onClose} 
          type="button" 
          variant="secondary"
          className="w-full"
        >
          Cerrar Cámara
        </Button>
      </div>
    </div>
  );
}
