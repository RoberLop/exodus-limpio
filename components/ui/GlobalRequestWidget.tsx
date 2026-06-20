'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function GlobalRequestWidget() {
  // Añadimos isAdmin a la desestructuración
  const { user, isAdmin, isSuperAdmin, isAuthenticated } = useAuth()
  
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false)
  
  // Gestión de estado para Autorizaciones
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [dismissedIds, setDismissedIds] = useState<number[]>([])
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Gestión de estado para Caídas Masivas
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportDept, setReportDept] = useState('TODOS')
  const [isReporting, setIsReporting] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  // NUEVO: Gestión de estado para Creación Rápida de Anuncios
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceMessage, setAnnounceMessage] = useState('')
  const [announceDept, setAnnounceDept] = useState('TODOS')
  const [announceImportance, setAnnounceImportance] = useState('Normal')
  const [isPublishing, setIsPublishing] = useState(false)

  // Referencias para arrastre
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
      if (!isSuperAdmin) query = query.eq('solicitante', user.name)
      else query = query.eq('estado', 'PENDIENTE')

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

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startPos.current = {
      x: e.clientX - currentPos.current.x,
      y: e.clientY - currentPos.current.y
    }
    document.body.style.userSelect = 'none'

    if (widgetRef.current) {
      widgetRef.current.style.transition = 'none'
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
        widgetRef.current.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Autorizaciones
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

  // Caídas Masivas
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setScreenshotPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleReportDowntime = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsReporting(true)

    const { error } = await supabase.from('caidas_masivas').insert([{
      titulo: reportTitle,
      descripcion: reportDescription,
      departamento: reportDept,
      creado_por: user?.name || 'Administrador',
      screenshot_url: screenshotPreview
    }])

    if (error) {
      alert('Error operativo al declarar incidente: ' + error.message)
    } else {
      setIsReportModalOpen(false)
      setReportTitle('')
      setReportDescription('')
      setScreenshotPreview(null)
    }
    setIsReporting(false)
  }

  // NUEVO: Envío rápido de Anuncios
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPublishing(true)

    const { error } = await supabase.from('anuncios').insert([{
      titulo: announceTitle,
      mensaje: announceMessage,
      departamento: announceDept,
      importancia: announceImportance,
      creado_por: user?.name || 'Administrador'
    }])

    if (error) {
      alert('Error al publicar el anuncio: ' + error.message)
    } else {
      setIsAnnounceModalOpen(false)
      setAnnounceTitle('')
      setAnnounceMessage('')
      setAnnounceImportance('Normal')
    }
    setIsPublishing(false)
  }

  if (!isAuthenticated || !user) return null

  const displayRequests = solicitudes.filter(s => !dismissedIds.includes(s.id))
  
  const notificationCount = displayRequests.filter(s => {
    if (isSuperAdmin) return s.estado === 'PENDIENTE'
    return s.estado !== 'PENDIENTE'
  }).length

  return (
    <>
      {/* PANEL FLOTANTE DE AUTORIZACIONES */}
      <div 
        ref={widgetRef}
        className={cn(
          "fixed bottom-24 right-6 z-[999] flex flex-col items-end transition-all duration-300",
          isAuthPanelOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
        style={{ transform: 'translate3d(0px, 0px, 0px)', willChange: 'transform' }}
      >
        <div className="w-80 sm:w-96 glass rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col">
          <div 
            className="bg-slate-800 p-4 flex justify-between items-center shadow-md cursor-move select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm pointer-events-none">
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
              {isSuperAdmin ? 'Autorizaciones Pendientes' : 'Centro de Notificaciones'}
            </div>
            <button onClick={(e) => { e.stopPropagation(); setIsAuthPanelOpen(false); }} className="text-slate-300 hover:text-white transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto custom-scrollbar p-3 bg-slate-50/50">
            {displayRequests.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6 font-medium">Bandeja limpia. No hay registros pendientes.</p>
            ) : (
              displayRequests.map(s => {
                let infoData = s.informacion_cambio
                if (typeof infoData === 'string') { try { infoData = JSON.parse(infoData) } catch (e) {} }
                const targetName = infoData?.name || infoData?.title || `Registro #${s.registro_id}`
                const targetExtra = infoData?.email || infoData?.area || ''

                return (
                  <div key={s.id} className="mb-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-800">{s.tipo_solicitud.replace('_', ' ')}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold border", s.estado === 'PENDIENTE' ? "bg-amber-50 text-amber-600 border-amber-200" : s.estado === 'APROBADO' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200")}>{s.estado}</span>
                    </div>
                    {isSuperAdmin ? (
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[11px] text-slate-500">De: <strong className="text-slate-700">{s.solicitante}</strong> {s.departamento !== 'TODOS' && ` (${s.departamento})`}</p>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <p className="text-[11px] text-slate-500">Objetivo: <strong className="text-slate-800">{targetName}</strong></p>
                          {targetExtra && <p className="text-[10px] text-slate-400 truncate">{targetExtra}</p>}
                        </div>
                        <p className="text-[11px] text-slate-600 pt-1"><span className="font-semibold">Motivo:</span> {s.observacion}</p>
                        {rejectingId === s.id ? (
                          <div className="mt-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <textarea className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Justificación del rechazo..." rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} autoFocus />
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
                          <p className="text-[11px] text-slate-500">Objetivo: <strong className="text-slate-800">{targetName}</strong></p>
                          {targetExtra && <p className="text-[10px] text-slate-400 truncate">{targetExtra}</p>}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 pt-1">{s.observacion}</p>
                        {s.estado === 'RECHAZADO' && <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700"><span className="font-bold">Gobernanza TI:</span> {s.procesado_por?.split('- Motivo: ')[1] || 'Solicitud denegada.'}</div>}
                        {s.estado === 'APROBADO' && s.tipo_solicitud === 'VER_PASSWORD' && <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs"><span className="font-bold text-emerald-800">Credencial autorizada: </span><code className="bg-white px-2 py-1 rounded border text-emerald-700 font-mono font-bold tracking-widest">{infoData?.password}</code></div>}
                        {s.estado !== 'PENDIENTE' && <button onClick={() => handleDismiss(s.id)} className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-slate-200">Entendido</button>}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* MENÚ SPEED DIAL DESPLEGABLE */}
      <div 
        className={cn(
          "fixed bottom-24 right-6 flex flex-col gap-3 items-end z-[998] transition-all duration-300",
          isSpeedDialOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        {/* NUEVO BOTÓN: Solo visible si el usuario es un administrador */}
        {isAdmin && (
          <button 
            onClick={() => { setIsAnnounceModalOpen(true); setIsSpeedDialOpen(false); }} 
            className="flex items-center gap-3 pl-5 pr-2 py-2 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/50 rounded-full hover:bg-slate-50 hover:scale-105 transition-all text-left group"
          >
            <span className="font-bold text-sm text-slate-700 group-hover:text-cyan-600 transition-colors">Publicar Anuncio</span>
            <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-inner">
              📢
            </div>
          </button>
        )}

        <button 
          onClick={() => { setIsAuthPanelOpen(true); setIsSpeedDialOpen(false); }} 
          className={cn(
            "flex items-center gap-3 pl-5 pr-2 py-2 bg-white/90 backdrop-blur-xl border rounded-full hover:scale-105 transition-all text-left group relative",
            notificationCount > 0 
              ? "border-sky-300 shadow-lg shadow-sky-500/30" 
              : "border-slate-200/60 shadow-xl shadow-slate-200/50 hover:bg-slate-50"
          )}
        >
          <span className="font-bold text-sm text-slate-700 group-hover:text-sky-500 transition-colors">Autorizaciones</span>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all relative",
            notificationCount > 0 
              ? "bg-sky-100 border border-sky-300 text-sky-600 shadow-[0_0_15px_rgba(14,165,233,0.5)]" 
              : "bg-sky-50 border border-sky-100 text-sky-500 shadow-inner"
          )}>
            🛡️
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
              </span>
            )}
          </div>
        </button>
        
        <button 
          onClick={() => { setIsReportModalOpen(true); setIsSpeedDialOpen(false); }} 
          className="flex items-center gap-3 pl-5 pr-2 py-2 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/50 rounded-full hover:bg-slate-50 hover:scale-105 transition-all text-left group"
        >
          <span className="font-bold text-sm text-slate-700 group-hover:text-red-600 transition-colors">Reportar Caída</span>
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner">
            🚨
          </div>
        </button>
      </div>

      {/* BOTÓN MAESTRO FLOTANTE (FAB) */}
      <div className="fixed bottom-6 right-6 z-[1000]">
        <button
          onClick={() => {
            if (isAuthPanelOpen) setIsAuthPanelOpen(false);
            else setIsSpeedDialOpen(!isSpeedDialOpen);
          }}
          className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border backdrop-blur-md",
            isSpeedDialOpen || isAuthPanelOpen 
              ? "bg-slate-800/90 border-slate-600/50 text-white rotate-45 scale-110 shadow-slate-800/20" 
              : "bg-sky-500/80 border-white/40 text-white hover:bg-sky-400/90 hover:scale-105 shadow-sky-500/30"
          )}
        >
          {/* Icono: Cruz Geométrica Continua de Relleno Sólido */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 10.5h-5.5V4.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v6H4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h6v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
          </svg>
          
          {!isSpeedDialOpen && !isAuthPanelOpen && notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white text-[9px] font-bold text-white items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            </span>
          )}
        </button>
      </div>

      {/* NUEVO MODAL: Formulario Rápido de Anuncios */}
      <Modal isOpen={isAnnounceModalOpen} onClose={() => setIsAnnounceModalOpen(false)} title="Difundir Anuncio Oficial">
        <form onSubmit={handleCreateAnnouncement} className="space-y-5 py-2">
          <div className="bg-cyan-50 border border-cyan-100 p-4 rounded-xl text-xs text-cyan-800 font-medium">
            El anuncio se publicará instantáneamente en el Centro de Información y aparecerá como una notificación global en las pantallas del departamento seleccionado.
          </div>
          
          <Input label="Título del Anuncio" required placeholder="Ej: Mantenimiento Programado" value={announceTitle} onChange={(e: any) => setAnnounceTitle(e.target.value)} />
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Mensaje del Comunicado</label>
            <textarea required rows={4} placeholder="Escribe la información aquí..." value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Alcance</label>
              <select value={announceDept} onChange={(e) => setAnnounceDept(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500/20">
                <option value="TODOS">Toda la Empresa</option>
                <option value="CAE">Soporte CAE</option>
                <option value="TI">Operaciones TI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Prioridad</label>
              <select value={announceImportance} onChange={(e) => setAnnounceImportance(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500/20">
                <option value="Normal">Informativa (Normal)</option>
                <option value="Alta">Urgente (Alta)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAnnounceModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" isLoading={isPublishing}>Publicar Anuncio</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE CAÍDA MASIVA */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Declaración de Incidente Mayor">
        <form onSubmit={handleReportDowntime} className="space-y-5 py-2">
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-xs text-red-700 font-medium">
            Al confirmar esta acción, se teñirá la plataforma de rojo y se disparará una alerta con cronómetro en las pantallas del departamento destino.
          </div>
          <Input label="Título de la Falla" required placeholder="Ej: Caída de Base de Datos Principal" value={reportTitle} onChange={(e: any) => setReportTitle(e.target.value)} />
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción y Síntomas</label>
            <textarea required rows={3} placeholder="Describa el impacto actual..." value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-500/20 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Alcance de la Alerta</label>
            <select value={reportDept} onChange={(e) => setReportDept(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-slate-500/20">
              <option value="TODOS">Alerta Global (Toda la Empresa)</option>
              <option value="CAE">Exclusivo Soporte CAE</option>
              <option value="TI">Exclusivo Operaciones TI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Captura de la Falla (Recomendado)</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => imageInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                  📎 Adjuntar Captura
                </button>
                {screenshotPreview && <span className="text-xs text-emerald-600 font-bold">✓ Imagen adjuntada</span>}
              </div>
              {screenshotPreview && (
                <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                  <img src={screenshotPreview} alt="Preview" className="w-full h-auto object-cover" />
                  <button type="button" onClick={() => setScreenshotPreview(null)} className="absolute top-1 right-1 bg-white/80 p-1 rounded hover:bg-red-50 hover:text-red-500 text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsReportModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" isLoading={isReporting}>Activar Alerta Roja</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}