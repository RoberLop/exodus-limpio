import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const areaLabels: Record<string, string> = {
  exodus: 'Exodus',   
  almacen: 'Almacén',
  credito: 'Crédito',
  pinpad: 'Pinpad',
  embarques: 'Embarques',
  movil: 'Móvil',
  admin: 'Panel de Administrador',
}

export const areaIcons: Record<string, string> = {
  exodus: '📁',
  almacen: '📦',
  credito: '💳',
  pinpad: '🔢',
  embarques: '🚚',
  movil: '📱',
  admin: '⚙️',
}

export const areaColors: Record<string, string> = {
  exodus: 'from-indigo-500 to-blue-700', 
  almacen: 'from-yellow-500 to-orange-500', 
  credito: 'from-emerald-500 to-teal-600',
  pinpad: 'from-violet-500 to-purple-600',
  embarques: 'from-amber-500 to-orange-600',
  movil: 'from-sky-500 to-blue-600',
  admin: 'from-slate-700 to-slate-900',
  
}