'use client'

import { ErrorCard as ErrorCardType } from '@/lib/types'
import { ErrorCardFront } from './ErrorCardFront'

interface ErrorCardProps {
  error: ErrorCardType
  onClick: () => void 
  onDelete: (id: string) => void // <--- Aquí es donde le decimos a TypeScript que sí existe
}

export function ErrorCard({ error, onClick, onDelete }: ErrorCardProps) {
  const formattedError = {
    ...error,
    screenshotUrl: (error as any).screenshot_url || (error as any).screenshotUrl || '',
    steps: (error as any).steps || []
  }

  return (
    <div 
      className="h-full cursor-pointer transition-transform duration-500 hover:scale-[1.03] group"
      onClick={onClick}
    >
      <ErrorCardFront error={formattedError as any} />
    </div>
  )
}