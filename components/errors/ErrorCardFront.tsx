'use client'

import { ErrorCard } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { useEffect, useState } from 'react'

interface ErrorCardFrontProps {
  error: ErrorCard
}

export function ErrorCardFront({ error }: ErrorCardFrontProps) {
  const [imgSrc, setImgSrc] = useState<string>('');

  useEffect(() => {
    // Si es Base64 muy largo, creamos un objeto URL
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

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden bg-white shadow-card border border-slate-100 transition-all duration-300 group-hover:shadow-card-hover group-hover:scale-[1.02]">
      <div className="relative h-full w-full bg-slate-100">
        {imgSrc ? (
          <img src={imgSrc} alt={error.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">Sin imagen</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        {error.code && (
          <div className="absolute top-4 left-4">
            <Badge variant="error" size="md">{error.code}</Badge>
          </div>
        )}
      </div>
    </div>
  )
}