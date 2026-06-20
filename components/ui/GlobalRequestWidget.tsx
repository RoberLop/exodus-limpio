'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function GlobalRequestWidget() {
  const { user, isSuperAdmin, isAuthenticated } = useAuth()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<number[]>([])

  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Referencias para motor de arrastre optimizado (Hardware Accelerated)
  const widgetRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const currentPos = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const dragBounds = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('exodus_dismissed_requests')
      if (stored) setDismissedIds(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchRequests = async () => {
      let query = supabase.from('solicitudes_cambio').select('*').order('creado_at', { ascending: false })
      
      if (!isSuperAdmin) {
        query = query.eq('solicitante', user.name)
      } else {
        query = query.eq('estado', 'PENDIENTE')
      }

      const { data } = await query
      if (data) setSolicitudes(data)
    }

    fetchRequests()

    const canal = supabase
      .channel('global-widget')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_cambio' }, () => {
        fetchRequests()
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [user, isSuperAdmin, isAuthenticated])

  // Motor de arrastre sin Layout Thrashing (Rendimiento 60FPS)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    
    startPos.current = {
      x: e.clientX - currentPos.current.x,
      y: e.clientY - currentPos.current.y
    }
    
    document.body.style.userSelect = 'none'

    if (widgetRef.current) {
      // Apagamos las transiciones CSS temporalmente para evitar latencia
      widgetRef.current.style.transition = 'none'
      
      // Calculamos los límites de la pantalla una sola vez por arrastre
      const rect = widgetRef.current.getBoundingClientRect()
      dragBounds.current = {
        maxX: 24,
        minX: -window.innerWidth + rect.width + 24,
        maxY: 24,
        minY: -window.innerHeight + rect.height + 24
      }
    }
  }

  useEffect(() => {
    let animationFrameId: number

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !widgetRef.current) return

      let newX = e.clientX - startPos.current.x
      let newY = e.clientY - startPos.current.y

      const { minX, maxX, minY, maxY } = dragBounds.current
      newX = Math.min(Math.max(newX, minX), maxX)
      newY = Math.min(Math.max(newY, minY), maxY)

      currentPos.current = { x: newX, y: newY }
      
      // Uso de requestAnimationFrame para sincronizar con la tasa de refresco del monitor
      animationFrameId = requestAnimationFrame(() => {
        if (widgetRef.current) {
          widgetRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`
        }
      })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.userSelect = ''
      
      if (widgetRef.current) {
        // Restauramos las transiciones de Tailwind
        widgetRef.current.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Recálculo de límites al expandir o contraer el widget
  useEffect(() => {
    if (isOpen && widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect()
      if (rect.top < 10) {
        const adjustment = 10 - rect.top
        currentPos.current.y += adjustment
        widgetRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`
      }
    }
  }, [isOpen])

  const handleAprobar = async (solicitud: any) => {
    setProcessingId(solicitud.id)
    try {
      let queryError = null

      if (solicitud.tipo_solicitud === 'ELIMINAR_TICKET') {
        const { error } = await supabase.from('errors').delete().eq('id', solicitud.registro_id)
        queryError = error
      } else if (solicitud.tipo_solicitud === 'EDITAR_TICKET') {
        const { error } = await supabase.from('errors').update(solicitud.informacion_cambio).eq('id', solicitud.registro_id)
        queryError = error
      } else if (solicitud.tipo_solicitud === 'ELIMINAR_USUARIO') {
        const { error } = await supabase.from('usuarios').delete().eq('id', parseInt(solicitud.registro_id))
        queryError = error
      } else if (solicitud.tipo_solicitud === 'CREAR_USUARIO') {
        const { error } = await supabase.from('usuarios').insert([solicitud.informacion_cambio])
        queryError = error
      } else if (solicitud.tipo_solicitud === 'EDITAR_USUARIO') {
        const { error } = await supabase.from('usuarios').update(solicitud.informacion_cambio).eq('id', parseInt(solicitud.registro_id))
        queryError = error
      }

      if (queryError) {
        alert('Error operativo en base de datos: ' + queryError.message)
        setProcessingId(null)
        return
      }

      await supabase.from('solicitudes_cambio').update({
        estado: 'APROBADO',
        procesado_por: user?.name || 'Administrador',
        procesado_at: new Date().toISOString()
      }).eq('id', solicitud.id)

    } catch (err) {
      console.error('Error de procesamiento:', err)
    }
    setProcessingId(null)
  }

  const handleConfirmRechazo = async (solicitud: any) => {
    if (!rejectReason.trim()) return
    setProcessingId(solicitud.id)

    const firmaRechazo = `${user?.name || 'Administrador'} - Motivo: ${rejectReason}`

    await supabase.from('solicitudes_cambio').update({
      estado: 'RECHAZADO',
      procesado_por: firmaRechazo,
      procesado_at: new Date().toISOString()
    }).eq('id', solicitud.id)

    setRejectingId(null)
    setRejectReason('')
    setProcessingId(null)
  }

  const handleDismiss = (id: number) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('exodus_dismissed_requests', JSON.stringify(newDismissed))
  }

  if (!isAuthenticated || !user) return null

  const displayRequests = solicitudes.filter(s => !dismissedIds.includes(s.id))
  const totalRelevant = displayRequests.length

  if (totalRelevant === 0 && !isOpen) return null

  return (
    <div 
      ref={widgetRef}
      className="fixed bottom-6 right-6 z-[999] flex flex-col items-end animate-in fade-in duration-300 transition-transform"
      style={{ transform: 'translate3d(0px, 0px, 0px)', willChange: 'transform' }}
    >
      
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 glass rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col">
          
          <div 
            className="bg-slate-800 p-4 flex justify-between items-center shadow-md cursor-move select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm pointer-events-none">
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              {isSuperAdmin ? 'Autorizaciones Pendientes' : 'Centro de Notificaciones'}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto custom-scrollbar p-3 bg-slate-50/50">
            {displayRequests.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6 font-medium">Bandeja limpia. No hay registros pendientes.</p>
            ) : (
              displayRequests.map(s => {
                let infoData = s.informacion_cambio
                if (typeof infoData === 'string') {
                  try { infoData = JSON.parse(infoData) } catch (e) {}
                }
                
                const targetName = infoData?.name || infoData?.title || `Registro #${s.registro_id}`
                const targetExtra = infoData?.email || infoData?.area || ''

                return (
                  <div key={s.id} className="mb-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-2">
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
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[11px] text-slate-500">
                          De: <strong className="text-slate-700">{s.solicitante}</strong>
                          {s.departamento !== 'TODOS' && ` (${s.departamento})`}
                        </p>
                        
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <p className="text-[11px] text-slate-500">
                            Objetivo: <strong className="text-slate-800">{targetName}</strong>
                          </p>
                          {targetExtra && (
                            <p className="text-[10px] text-slate-400 truncate">{targetExtra}</p>
                          )}
                        </div>
                        
                        <p className="text-[11px] text-slate-600 pt-1">
                          <span className="font-semibold">Motivo de solicitud:</span> {s.observacion}
                        </p>
                        
                        {rejectingId === s.id ? (
                          <div className="mt-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <textarea 
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                              placeholder="Justificación del rechazo..."
                              rows={2}
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setRejectingId(null)} className="flex-1 py-1 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                              <button onClick={() => handleConfirmRechazo(s)} disabled={processingId === s.id} className="flex-1 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">Confirmar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                            <button onClick={() => setRejectingId(s.id)} disabled={processingId === s.id} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors disabled:opacity-50">Rechazar</button>
                            <button onClick={() => handleAprobar(s)} disabled={processingId === s.id} className="px-3 py-1 bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50">{processingId === s.id ? 'Procesando...' : 'Aprobar'}</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <p className="text-[11px] text-slate-500">
                            Objetivo: <strong className="text-slate-800">{targetName}</strong>
                          </p>
                          {targetExtra && (
                            <p className="text-[10px] text-slate-400 truncate">{targetExtra}</p>
                          )}
                        </div>
                        
                        <p className="text-[11px] text-slate-500 line-clamp-2 pt-1">{s.observacion}</p>
                        
                        {s.estado === 'RECHAZADO' && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                            <span className="font-bold">Gobernanza TI:</span> {s.procesado_por?.split('- Motivo: ')[1] || 'Solicitud denegada.'}
                          </div>
                        )}

                        {s.estado === 'APROBADO' && s.tipo_solicitud === 'VER_PASSWORD' && (
                          <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                            <span className="font-bold text-emerald-800">Credencial autorizada: </span>
                            <code className="bg-white px-2 py-1 rounded border text-emerald-700 font-mono font-bold tracking-widest">{infoData?.password}</code>
                          </div>
                        )}

                        {s.estado !== 'PENDIENTE' && (
                          <button 
                            onClick={() => handleDismiss(s.id)}
                            className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                          >
                            Entendido
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Control flotante (Arrastrable) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={handleMouseDown}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 border-2 cursor-move select-none",
          isOpen ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-800 border-slate-700 text-white"
        )}
      >
        <div className="relative pointer-events-none">
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          
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