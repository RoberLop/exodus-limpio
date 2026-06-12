import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const areaLabels: Record<string, string> = {
  global: 'Soluciones Globales',
  exodus: 'Exodus',
  exodus_mostradores: 'Exodus Mostradores',
  exodus_sucursales: 'Exodus Sucursales',
  exodus_sucursales_sic: 'Exodus Sucursales SIC',
  exodus_erp_profesional: 'Exodus ERP Profesional',
  exodus_profesional_2013: 'Exodus Profesional 2013',
  exodus_embarques: 'Exodus Embarques',
  exodus_epico: 'Exodus Épico',
  almacen: 'Almacén',
  credito: 'Crédito',
  pinpad: 'Pinpad',
  embarques: 'Embarques',
  movil: 'Móvil',
  full_info: 'Full Información',
  admin: 'Panel de Administrador',
}

export const areaIcons: Record<string, string> = {
  global: '🌎',
  exodus: '📁',
  exodus_mostradores: '',
  exodus_sucursales: '',
  exodus_sucursales_sic: '',
  exodus_erp_profesional: '',
  exodus_profesional_2013: '',
  exodus_embarques: '',
  exodus_epico: '',
  almacen: '📦',
  credito: '💳',
  pinpad: '🔢',
  embarques: '🚚',
  movil: '📱',
  full_info: '📚',
  admin: '⚙️',
}

export const areaColors: Record<string, string> = {
  global: 'from-slate-800 to-slate-900',
  exodus: 'from-indigo-500 to-blue-700',
  exodus_mostradores: 'from-indigo-400 to-blue-600',
  exodus_sucursales: 'from-indigo-400 to-blue-600',
  exodus_sucursales_sic: 'from-indigo-400 to-blue-600',
  exodus_erp_profesional: 'from-indigo-400 to-blue-600',
  exodus_profesional_2013: 'from-indigo-400 to-blue-600',
  exodus_embarques: 'from-indigo-400 to-blue-600',
  exodus_epico: 'from-indigo-400 to-blue-600',
  almacen: 'from-yellow-500 to-orange-500', 
  credito: 'from-emerald-500 to-teal-600',
  pinpad: 'from-violet-500 to-purple-600',
  embarques: 'from-amber-500 to-orange-600',
  movil: 'from-sky-500 to-blue-600',
  full_info: 'from-cyan-500 to-blue-500',
  admin: 'from-slate-700 to-slate-900',
}