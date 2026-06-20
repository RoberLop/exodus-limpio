'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

// Componente: Sistema de Alerta Temprana e Incidentes Mayores
export function MajorIncidentBanner() {
  const { user, isAuthenticated } = useAuth()
  const [activeIncident, setActiveIncident] = useState<any | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('00:00')

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [steps, setSteps] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [solvedIncidentPopup, setSolvedIncidentPopup] = useState<any | null>(null)
  
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  // Suscripción a eventos críticos
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchActiveIncident = async () => {
      const { data } = await supabase
        .from('caidas_masivas')
        .select('*')
        .eq('estado', 'ACTIVO')
        .or(`departamento.eq.TODOS,departamento.eq.${user.department}`)
        .order('creado_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setActiveIncident(data[0])
      } else {
        setActiveIncident(null)
      }
    }

    fetchActiveIncident()

    const canal = supabase
      .channel('major-incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caidas_masivas' }, (payload) => {
        fetchActiveIncident()
        
        if (payload.eventType === 'UPDATE' && payload.new.estado === 'RESUELTO') {
          setSolvedIncidentPopup(payload.new)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [user, isAuthenticated])

  // Cronómetro de inactividad
  useEffect(() => {
    if (!activeIncident) return

    const timer = setInterval(() => {
      const startTime = new Date(activeIncident.creado_at).getTime()
      const now = new Date().getTime()
      const diff = Math.max(0, now - startTime)

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setElapsedTime(`${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(timer)
  }, [activeIncident])

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) setSteps(steps.filter((_, i) => i !== index))
  }

  // Ejecución de remediación
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

  return (
    <>
      {/* Tinte global de emergencia (War-Room Mode) */}
      {activeIncident && (
        <div className="fixed inset-0 bg-red-600/10 mix-blend-multiply pointer-events-none z-[9998] transition-opacity duration-1000" />
      )}

      {/* Banner Superior Integrado Glassmorphism */}
      {activeIncident && (
        <div className="fixed top-6 right-6 left-[310px] z-[9999] bg-red-950/80 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl shadow-red-900/20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1 group"
              onClick={() => setIsDetailModalOpen(true)}
            >
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-red-200"></span>
              </span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 group-hover:text-red-200 transition-colors">
                  Incidente Crítico: {activeIncident.titulo}
                  <span className="text-[10px] font-bold bg-red-900/50 border border-red-500/30 px-2 py-0.5 rounded-md text-red-200">Ver detalles</span>
                </h2>
                <p className="text-xs text-red-200/70 font-medium line-clamp-1 mt-0.5">{activeIncident.descripcion}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Tiempo de Inactividad</p>
                <p className="text-2xl font-mono font-black tabular-nums tracking-tight text-red-50">{elapsedTime}</p>
              </div>
              <button 
                onClick={() => setIsResolveModalOpen(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white border border-red-400/50 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                Solucionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Información y Evidencias de la Falla */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detalles del Incidente Mayor">
        <div className="space-y-4 py-2">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <span className="text-[10px] px-2 py-0.5 font-bold uppercase border bg-white text-red-600 border-red-200 rounded-md">
              Afectación: {activeIncident?.departamento === 'TODOS' ? 'Global' : activeIncident?.departamento}
            </span>
            <h3 className="text-lg font-black text-red-900 mt-2">{activeIncident?.titulo}</h3>
            <p className="text-sm text-red-800/80 mt-1 font-medium">{activeIncident?.descripcion}</p>
          </div>

          {/* Visualizador de Imagen Integrado */}
          {activeIncident?.screenshot_url && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Evidencia Fotográfica Inicial</label>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 shadow-inner">
                <img 
                  src={activeIncident.screenshot_url} 
                  alt="Captura del error" 
                  className="w-full rounded-lg max-h-72 object-contain"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Declarado por: <strong className="text-slate-800">{activeIncident?.creado_por}</strong></span>
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>Cerrar panel</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Formulario de Cierre */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Documentar Solución de Caída">
        <form onSubmit={handleResolveIncident} className="space-y-5 py-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
            Al registrar la solución, el incidente se cerrará globalmente y se notificará el procedimiento a todo el personal.
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Documento de Respaldo</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => documentInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                Adjuntar Archivo
              </button>
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
                  {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="px-3 text-slate-400 hover:text-red-500 font-bold text-xs">Quitar</button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSteps([...steps, ''])} className="mt-3 text-xs text-slate-600 hover:text-slate-900 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
              + Agregar Paso
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsResolveModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" isLoading={isSubmitting}>Cerrar Incidente</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Notificación Global de Solución */}
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
              <h3 className="text-base font-black text-slate-900">{solvedIncidentPopup.titulo}</h3>
              <p className="text-xs text-slate-500 font-medium">Tiempo total de impacto: <strong className="text-slate-800">{solvedIncidentPopup.tiempo_inactividad_minutos} minutos</strong></p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl shadow-inner border border-slate-800 text-white">
              <h4 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-wider">Bitácora de Remediación</h4>
              <div className="space-y-2">
                {(solvedIncidentPopup.pasos_solucion || []).map((step: string, i: number) => (
                  <p key={i} className="text-sm text-slate-200 leading-relaxed font-medium">
                    <span className="font-black text-slate-500 mr-2">{i + 1}.</span> {step}
                  </p>
                ))}
              </div>
            </div>

            {solvedIncidentPopup.archivo_url && (
              <a 
                href={solvedIncidentPopup.archivo_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
              >
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