import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const areaLabels: Record<string, string> = {
  credito: 'Crédito',
  pinpad: 'Pinpad',
  embarques: 'Embarques',
  movil: 'Móvil',
  admin: 'Panel de Administrador',
}

export const areaIcons: Record<string, string> = {
  credito: '💳',
  pinpad: '🔢',
  embarques: '📦',
  movil: '📱',
  admin: '⚙️',
}

export const areaColors: Record<string, string> = {
  credito: 'from-emerald-500 to-teal-600',
  pinpad: 'from-violet-500 to-purple-600',
  embarques: 'from-amber-500 to-orange-600',
  movil: 'from-sky-500 to-blue-600',
  admin: 'from-slate-700 to-slate-900',
}