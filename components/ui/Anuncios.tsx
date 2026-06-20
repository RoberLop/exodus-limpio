'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function Anuncios() {
  const { user } = useAuth()
  const [anuncios, setAnuncios] = useState<any[]>([])

  // Petición a base de datos
  useEffect(() => {
    if (user?.department) fetchAnuncios()
  }, [user?.department])

  const fetchAnuncios = async () => {
    const { data } = await supabase
      .from('anuncios')
      .select('*')
      .or(`departamento.eq.TODOS,departamento.eq.${user?.department}`)
      .order('created_at', { ascending: false })
      .limit(6) // Límite ampliado para Centro de Información

    if (data) setAnuncios(data)
  }

  if (anuncios.length === 0) return null

  return (
    <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
        <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        Tablero de Avisos
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {anuncios.map((anuncio) => (
          <div 
            key={anuncio.id} 
            className={cn(
              "relative p-5 rounded-3xl border overflow-hidden group hover:shadow-md transition-all",
              anuncio.importancia === 'Alta' 
                ? "bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200" 
                : "glass border-white/40 shadow-sm shadow-blue-900/5"
            )}
          >
            {/* Etiquetas Superiores */}
            <div className="flex justify-between items-start mb-3">
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                anuncio.departamento === 'TODOS' ? "bg-slate-800 text-white" :
                anuncio.departamento === 'CAE' ? "bg-cyan-100 text-cyan-800 border border-cyan-200" :
                "bg-blue-100 text-blue-800 border border-blue-200"
              )}>
                {anuncio.departamento === 'TODOS' ? 'Global' : anuncio.departamento}
              </span>
              
              {anuncio.importancia === 'Alta' && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              )}
            </div>

            {/* Información del Comunicado */}
            <h3 className="font-bold text-slate-900 mb-1.5 leading-tight">{anuncio.titulo}</h3>
            <p className="text-sm text-slate-600 mb-4">{anuncio.mensaje}</p>
            
            {/* Remitente */}
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 border-t border-blue-900/10 pt-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                {anuncio.creado_por.charAt(0)}
              </div>
              {anuncio.creado_por}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}