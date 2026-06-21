'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function MajorIncidentBanner() {
  const { user, isAuthenticated } = useAuth()
  const [incidents, setIncidents] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState<string>('00m 00s')

  // Estados de modales
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [steps, setSteps] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [solvedIncidentPopup, setSolvedIncidentPopup] = useState<any | null>(null)
  
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  // Polling y Realtime para capturar TODOS los incidentes activos
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchActiveIncidents = async () => {
      const { data } = await supabase
        .from('caidas_masivas')
        .select('*')
        .eq('estado', 'ACTIVO')
        .or(`departamento.eq.TODOS,departamento.eq.${user.department}`)
        .order('creado_at', { ascending: false })

      setIncidents(data || [])
    }

    fetchActiveIncidents()

    const canal = supabase
      .channel('major-incidents-carousel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caidas_masivas' }, (payload) => {
        fetchActiveIncidents()
        
        if (payload.eventType === 'UPDATE' && payload.new.estado === 'RESUELTO') {
          setSolvedIncidentPopup(payload.new)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [user, isAuthenticated])

  // Ajustar el índice si la lista de incidentes cambia
  useEffect(() => {
    if (currentIndex >= incidents.length && incidents.length > 0) {
      setCurrentIndex(incidents.length - 1)
    }
  }, [incidents, currentIndex])

  // Alerta de tiempo dinámico para el incidente seleccionado en el carrusel
  useEffect(() => {
    const activeIncident = incidents[currentIndex]
    if (!activeIncident) return

    const timer = setInterval(() => {
      const startTime = new Date(activeIncident.creado_at).getTime()
      const now = new Date().getTime()
      const diff = Math.max(0, now - startTime)

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      const parts = []
      if (days > 0) parts.push(`${days}d`)
      if (hours > 0 || days > 0) parts.push(`${hours}h`)
      parts.push(`${minutes}m`)
      parts.push(`${seconds}s`)

      setElapsedTime(parts.join(' '))
    }, 1000)

    return () => clearInterval(timer)
  }, [incidents, currentIndex])

  const activeIncident = incidents[currentIndex]

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) setSteps(steps.filter((_, i) => i !== index))
  }

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    let finalArchivoUrl = null

    if (attachedFile) {
      const fileExt = attachedFile.name.split('.').pop()
      const fileName = `caida_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('adjuntos').upload(fileName, attachedFile)

      if (uploadError) {
        alert('Error al subir evidencia: ' + uploadError.message)
        setIsSubmitting(false)
        return
      }

      const { data: urlData } = supabase.storage.from('adjuntos').getPublicUrl(fileName)
      finalArchivoUrl = urlData.publicUrl
    }

    const startTime = new Date(activeIncident.creado_at).getTime()
    const endTime = new Date().getTime()
    const totalMinutes = Math.floor((endTime - startTime) / 60000)

    const payload = {
      estado: 'RESUELTO',
      resuelto_at: new Date().toISOString(),
      resuelto_por: user?.name,
      tiempo_inactividad_minutos: totalMinutes,
      pasos_solucion: steps,
      archivo_url: finalArchivoUrl
    }

    const { error } = await supabase.from('caidas_masivas').update(payload).eq('id', activeIncident.id)

    if (error) {
      alert('Error al registrar solución: ' + error.message)
    } else {
      setIsResolveModalOpen(false)
      setSteps([''])
      setAttachedFile(null)
    }

    setIsSubmitting(false)
  }

  if (incidents.length === 0) return null

  return (
    <>
      {/* FONDO AMBIENTAL ANIMADO MEJORADO */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {/* Luz intensa exclusiva para teñir el Sidebar desde abajo (sin tocar el centro) */}
        <div className="absolute top-0 left-0 bottom-0 w-[300px] bg-gradient-to-r from-red-600/30 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
        
        {/* Resplandor radial general muy suave y sin cortes bruscos */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
      </div>

      {/* Banner de Control (Ahora es 100% Sólido para resaltar sobre cualquier fondo) */}
      <div className="fixed top-6 right-6 left-[310px] z-[9999] bg-gradient-to-r from-red-950 to-red-900 border border-red-500/50 rounded-2xl shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Controles de navegación si hay más de una caída activa */}
            {incidents.length > 1 && (
              <div className="flex items-center gap-1.5 bg-red-900/60 p-1 rounded-xl border border-red-500/30 shrink-0 shadow-inner">
                <button 
                  onClick={() => setCurrentIndex((prev) => (prev === 0 ? incidents.length - 1 : prev - 1))}
                  className="p-1 hover:bg-red-800 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-[10px] font-mono font-bold px-1 select-none">
                  {currentIndex + 1}/{incidents.length}
                </span>
                <button 
                  onClick={() => setCurrentIndex((prev) => (prev === incidents.length - 1 ? 0 : prev + 1))}
                  className="p-1 hover:bg-red-800 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

            <div 
              className="flex items-center gap-3 cursor-pointer group flex-1"
              onClick={() => setIsDetailModalOpen(true)}
            >
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-red-200"></span>
              </span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 group-hover:text-red-200 transition-colors">
                  {activeIncident.titulo || 'Incidente Crítico'}
                  <span className="text-[10px] font-bold bg-red-900/80 border border-red-500/50 px-2 py-0.5 rounded-md text-red-200 shadow-sm">Detalles</span>
                </h2>
                <p className="text-xs text-red-200/80 font-medium line-clamp-1 mt-0.5">{activeIncident.descripcion}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-[9px] font-bold text-red-400/90 uppercase tracking-widest">Inactividad Total</p>
              <p className="text-2xl font-mono font-black tabular-nums tracking-tight text-white drop-shadow-md">{elapsedTime}</p>
            </div>
            <button 
              onClick={() => setIsResolveModalOpen(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white border border-red-400/80 font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer hover:scale-105"
            >
              Solucionar
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Información de la Falla */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detalles del Incidente Mayor">
        <div className="space-y-4 py-2">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <span className="text-[10px] px-2 py-0.5 font-bold uppercase border bg-white text-red-600 border-red-200 rounded-md">
              Afectación: {activeIncident?.departamento === 'TODOS' ? 'Global' : activeIncident?.departamento}
            </span>
            <h3 className="text-lg font-black text-red-900 mt-2">{activeIncident?.titulo || 'Incidente Crítico'}</h3>
            <p className="text-sm text-red-800/80 mt-1 font-medium">{activeIncident?.descripcion}</p>
          </div>

          {activeIncident?.screenshot_url && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Evidencia Fotográfica Inicial</label>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 shadow-inner">
                <img src={activeIncident.screenshot_url} alt="Captura del error" className="w-full rounded-lg max-h-72 object-contain" />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Declarado por: <strong className="text-slate-800">{activeIncident?.creado_por}</strong></span>
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>Cerrar panel</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Formulario de Cierre */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Documentar Solución de Caída">
        <form onSubmit={handleResolveIncident} className="space-y-5 py-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
            Al registrar la solución, el incidente se cerrará globalmente y se notificará el procedimiento a todo el personal.
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Documento de Respaldo</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => documentInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer">Adjuntar Archivo</button>
              {attachedFile && <span className="text-xs text-emerald-600 font-bold truncate max-w-xs">{attachedFile.name}</span>}
            </div>
            <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} className="hidden" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Procedimiento Aplicado</label>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} required placeholder={`Paso técnico ${index + 1}`} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20 text-sm" />
                  {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="px-3 text-slate-400 hover:text-red-500 font-bold text-xs cursor-pointer">Quitar</button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSteps([...steps, ''])} className="mt-3 text-xs text-slate-600 hover:text-slate-900 font-bold bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer">+ Agregar Paso</button>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsResolveModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" isLoading={isSubmitting}>Cerrar Incidente</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Notificación Global de Solución */}
      <Modal isOpen={!!solvedIncidentPopup} onClose={() => setSolvedIncidentPopup(null)} title="Incidente Resuelto">
        {solvedIncidentPopup && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Sistema Restablecido
              </h4>
              <p className="text-xs mt-1 font-medium">El impacto operativo ha sido mitigado exitosamente.</p>
            </div>
            <div className="space-y-1 px-2">
              <h3 className="text-base font-black text-slate-900">{solvedIncidentPopup.titulo || 'Incidente'}</h3>
              <p className="text-xs text-slate-500 font-medium">Tiempo total de impacto: <strong className="text-slate-800">{solvedIncidentPopup.tiempo_inactividad_minutos} minutos</strong></p>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl shadow-inner border border-slate-800 text-white">
              <h4 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-wider">Bitácora de Remediación</h4>
              <div className="space-y-2">
                {(solvedIncidentPopup.pasos_solucion || []).map((step: string, i: number) => (
                  <p key={i} className="text-sm text-slate-200 leading-relaxed font-medium"><span className="font-black text-slate-500 mr-2">{i + 1}.</span> {step}</p>
                ))}
              </div>
            </div>
            {solvedIncidentPopup.archivo_url && (
              <a href={solvedIncidentPopup.archivo_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar Documentación de Cierre
              </a>
            )}
            <div className="pt-2 flex justify-end">
              <Button onClick={() => setSolvedIncidentPopup(null)}>Entendido</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}