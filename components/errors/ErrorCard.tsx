'use client'

import { cn } from '@/lib/utils'
import { areaLabels } from '@/lib/utils'

export function ErrorCard({ error, onClick, onDelete }: any) {
  return (
    <div 
      onClick={onClick}
      className="relative w-full h-[260px] rounded-3xl overflow-hidden group cursor-pointer border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* 1. Capa de Fondo (Imagen anclada arriba o Gradiente Corporativo) */}
      {error.screenshotUrl ? (
        <img 
          src={error.screenshotUrl} 
          alt={error.title || 'Error'} 
          className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out" 
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
      )}

      {/* 2. Capa de Contraste Glassmorphism (Gradiente traslúcido) */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/20 transition-opacity duration-300",
        error.screenshotUrl ? "opacity-85 group-hover:opacity-95" : "opacity-100"
      )} />

      {/* 3. Badges Superiores (Área y Prioridad) */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
        {error.prioridad && (
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border shadow-sm",
            error.prioridad === 'Alta' ? "bg-red-500/30 text-red-200 border-red-500/40" : 
            error.prioridad === 'Común' ? "bg-blue-500/30 text-blue-200 border-blue-500/40" : 
            "bg-slate-500/40 text-slate-200 border-slate-400/30"
          )}>
            {error.prioridad}
          </span>
        )}
        {error.area && (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-sm">
            {areaLabels[error.area] || error.area}
          </span>
        )}
      </div>

      {/* 4. Contenido Inferior (Título + Creado por + Botón de Acción) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col justify-end">
        <h3 className="text-white font-bold text-base leading-snug mb-3 line-clamp-2 group-hover:text-sky-400 transition-colors">
          {error.title || 'Ticket Operativo'}
        </h3>
        
        {/* Footer: Creado por y Flecha */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-2 tracking-wider">
            <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/40 text-[9px] text-sky-300 font-black">
              {error.creado_por ? error.creado_por.charAt(0).toUpperCase() : 'S'}
            </div>
            <span className="truncate max-w-[120px]">{error.creado_por || 'Sistema'}</span>
          </span>
          
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-sky-500 group-hover:border-sky-400 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}