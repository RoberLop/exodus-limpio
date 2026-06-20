'use client'

import { ErrorCard } from '@/lib/types'
import { useEffect, useState } from 'react'

interface ErrorCardFrontProps {
  error: ErrorCard
}

export function ErrorCardFront({ error }: ErrorCardFrontProps) {
  // Gestión de estado local
  const [imgSrc, setImgSrc] = useState<string>('');

  // Procesamiento de renderizado de imagen (Base64 / URL)
  useEffect(() => {
    if (error.screenshotUrl && error.screenshotUrl.startsWith('data:image')) {
      try {
        const byteString = atob(error.screenshotUrl.split(',')[1]);
        const mimeString = error.screenshotUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        setImgSrc(URL.createObjectURL(blob));
      } catch (e) {
        console.error("Error convirtiendo a Blob:", e);
      }
    } else {
      setImgSrc(error.screenshotUrl || '');
    }
  }, [error.screenshotUrl]);

  // Renderizado de tarjeta principal
  return (
    <div className="h-full w-full rounded-3xl overflow-hidden bg-white shadow-card border border-slate-100 transition-all duration-300 group-hover:shadow-card-hover group-hover:scale-[1.02]">
      <div className="relative h-full w-full bg-slate-100 min-h-[160px]">
        {imgSrc ? (
          <img src={imgSrc} alt={error.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">Sin imagen</div>
        )}
        
        {/* Superposición de gradiente superior */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        
        {/* Contenedor de título (Superposición inferior) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 pointer-events-none">
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
            {error.title}
          </h3>
        </div>

      </div>
    </div>
  )
}