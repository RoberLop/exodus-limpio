'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function GlobalRequestWidget() {
  const { user, isSuperAdmin, isAuthenticated } = useAuth()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<number[]>([])

  // Cargar las notificaciones que el usuario ya marcó como "Entendidas" para no volver a mostrarlas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('exodus_dismissed_requests')
      if (stored) setDismissedIds(JSON.parse(stored))
    }
  }, [])

  const handleDismiss = (id: number) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('exodus_dismissed_requests', JSON.stringify(newDismissed))
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchRequests = async () => {
      let query = supabase.from('solicitudes_cambio').select('*').order('creado_at', { ascending: false })
      
      if (!isSuperAdmin) {
        // Los admins normales solo ven sus propias solicitudes
        query = query.eq('solicitante', user.name)
      } else {
        // Los Super Admins solo necesitan que se les notifique lo que está PENDIENTE
        query = query.eq('estado', 'PENDIENTE')
      }

      const { data } = await query
      if (data) setSolicitudes(data)
    }

    fetchRequests()

    // Escuchar cambios en vivo (Si alguien aprueba/rechaza, la ventanita se actualiza sola)
    const canal = supabase
      .channel('global-widget')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_cambio' }, () => {
        fetchRequests()
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [user, isSuperAdmin, isAuthenticated])

  if (!isAuthenticated || !user) return null

  // Filtramos las que ya fueron descartadas por el usuario localmente
  const displayRequests = solicitudes.filter(s => !dismissedIds.includes(s.id))
  
  const pendingCount = displayRequests.filter(s => s.estado === 'PENDIENTE').length
  const resolvedCount = displayRequests.filter(s => s.estado !== 'PENDIENTE').length

  const totalRelevant = displayRequests.length

  // Si no hay nada relevante y la ventana está cerrada, ocultamos el widget por completo
  if (totalRelevant === 0 && !isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* EL PANEL EXPANDIDO */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 glass rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col">
          <div className="bg-slate-800 p-4 flex justify-between items-center shadow-md">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              {isSuperAdmin ? '📋 Solicitudes por Revisar' : '🔔 Mis Autorizaciones'}
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 bg-slate-50/50">
            {displayRequests.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6 font-medium">No hay notificaciones nuevas.</p>
            ) : (
              displayRequests.map(s => (
                <div key={s.id} className="mb-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-800">
                      {s.tipo_solicitud.replace('_', ' ')}
                    </span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded font-bold border",
                      s.estado === 'PENDIENTE' ? "bg-amber-50 text-amber-600 border-amber-200" :
                      s.estado === 'APROBADO' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      "bg-red-50 text-red-600 border-red-200"
                    )}>
                      {s.estado}
                    </span>
                  </div>
                  
                  {isSuperAdmin ? (
                    <p className="text-[11px] text-slate-500">De: <strong className="text-slate-700">{s.solicitante}</strong></p>
                  ) : (
                    <p className="text-[11px] text-slate-500 line-clamp-2">{s.observacion}</p>
                  )}

                  {/* Botón para quitar la notificación (Solo si ya se resolvió) */}
                  {!isSuperAdmin && s.estado !== 'PENDIENTE' && (
                    <button 
                      onClick={() => handleDismiss(s.id)}
                      className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                    >
                      Entendido
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EL BOTÓN FLOTANTE (BURBUJA) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 border-2",
          isOpen ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-800 border-slate-700 text-white"
        )}
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpen 
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            }
          </svg>
          
          {/* Circulito rojo de notificaciones */}
          {!isOpen && totalRelevant > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white text-[9px] font-bold text-white items-center justify-center">
                {totalRelevant > 9 ? '9+' : totalRelevant}
              </span>
            </span>
          )}
        </div>
      </button>

    </div>
  )
}