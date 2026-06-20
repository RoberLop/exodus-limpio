'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function GlobalAnnounceBanner() {
  const { user, isAuthenticated } = useAuth()
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [seenIds, setSeenIds] = useState<number[]>([])

  // Inicialización de persistencia local
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('exodus_seen_announcements')
      if (stored) setSeenIds(JSON.parse(stored))
    }
  }, [])

  // Suscripción Realtime a tabla de anuncios
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchAnuncios = async () => {
      const { data } = await supabase
        .from('anuncios')
        .select('*')
        .or(`departamento.eq.TODOS,departamento.eq.${user.department}`)
        .order('created_at', { ascending: false })

      if (data) setAnuncios(data)
    }

    fetchAnuncios()

    const canal = supabase
      .channel('global-announcements-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anuncios' }, () => {
        fetchAnuncios()
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [user, isAuthenticated])

  // Controlador de lectura de comunicados
  const handleDismiss = (id: number) => {
    const updatedSeenIds = [...seenIds, id]
    setSeenIds(updatedSeenIds)
    localStorage.setItem('exodus_seen_announcements', JSON.stringify(updatedSeenIds))
  }

  if (!isAuthenticated || !user) return null

  // Filtrado de comunicados pendientes de lectura
  const unreadAnnouncements = anuncios.filter(a => !seenIds.includes(a.id))
  
  if (unreadAnnouncements.length === 0) return null

  const activeAnnounce = unreadAnnouncements[0]

  return (
    <>
      {/* Tinte ambiental corporativo */}
      <div className="fixed inset-0 bg-blue-900/5 mix-blend-multiply pointer-events-none z-[9996] transition-opacity duration-1000" />

      {/* Banner de Comunicación Oficial */}
      <div className="fixed top-6 right-6 left-[310px] z-[9997] bg-blue-950/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          
          <div className="flex items-center gap-4 flex-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-900/50 border border-blue-500/30 text-blue-300 shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-blue-50 tracking-wider">
                  {activeAnnounce.titulo}
                </h2>
                {activeAnnounce.importancia === 'Alta' && (
                  <span className="text-[9px] font-bold bg-red-500/20 border border-red-500/50 px-2 py-0.5 rounded text-red-200 uppercase tracking-widest animate-pulse">
                    Importante
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200/80 font-medium line-clamp-2 mt-0.5 pr-4">
                {activeAnnounce.mensaje}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:block text-right mr-2">
              <p className="text-[9px] font-bold text-blue-400/80 uppercase tracking-widest">Emitido por</p>
              <p className="text-xs font-bold text-blue-100">{activeAnnounce.creado_por}</p>
            </div>
            <button 
              onClick={() => handleDismiss(activeAnnounce.id)}
              className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-500/40 text-blue-100 border border-blue-400/30 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
            >
              Entendido
            </button>
          </div>

        </div>
      </div>
    </>
  )
}