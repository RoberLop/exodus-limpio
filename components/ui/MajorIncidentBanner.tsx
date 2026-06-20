'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function MajorIncidentBanner() {
  const { user, isAuthenticated } = useAuth()
  const [activeIncident, setActiveIncident] = useState<any | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('00:00')

  // Estados de visualización de detalles y resolución
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [steps, setSteps] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para notificación de solución global
  const [solvedIncidentPopup, setSolvedIncidentPopup] = useState<any | null>(null)
  
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  // Consulta inicial y escucha de eventos en tiempo real
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
        
        // Disparo de notificación global cuando un incidente es resuelto
        if (payload.eventType === 'UPDATE' && payload.new.estado === 'RESUELTO') {
          setSolvedIncidentPopup(payload.new)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [user, isAuthenticated])

  // Cronómetro de precisión para tiempo de impacto
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
      {/* Tinte de advertencia ambiental para el fondo de pantalla */}
      {activeIncident && (
        <div className="fixed inset-0 bg-red-600/[0.03] pointer-events-none z-0" />
      )}

      {/* Banner Integrado al Layout (No colisiona con elementos fijos) */}
      {activeIncident && (
        <div className="w-full mb-6 bg-gradient-to-r from-red-600 to-red-700 rounded-3xl border-b-4 border-red-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => setIsDetailModalOpen(true)}
            >
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  Incidente Crítico: {activeIncident.titulo}
                  <span className="text-[10px] font-bold bg-red-800 px-2 py-0.5 rounded text-red-200">Ver detalles</span>
                </h2>
                <p className="text-xs text-red-100 opacity-90 line-clamp-1">{activeIncident.descripcion}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[9px] font-bold text-red-200 uppercase tracking-wider">Inactividad</p>
                <p className="text-lg font-mono font-black tabular-nums tracking-tight">{elapsedTime}</p>
              </div>
              <button 
                onClick={() => setIsResolveModalOpen(true)}
                className="px-4 py-2 bg-white text-red-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-red-50 transition-all"
              >
                Solucionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalles del Incidente Activo */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detalles de Incidente Crítico">
        <div className="space-y-4 py-2">
          <div>
            <span className="text-[10px] px-2 py-0.5 font-bold uppercase border bg-red-50 text-red-600 border-red-100 rounded">
              Área: {activeIncident?.departamento}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-2">{activeIncident?.titulo}</h3>
            <p className="text-sm text-slate-600 mt-1">{activeIncident?.descripcion}</p>
          </div>

          {activeIncident?.screenshot_url && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Evidencia Fotográfica Inicial</label>
              <img 
                src={activeIncident.screenshot_url} 
                alt="Evidencia inicial" 
                className="w-full rounded-xl border border-slate-200 shadow-sm max-h-60 object-contain bg-slate-50"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>Reportado por: <strong>{activeIncident?.creado_por}</strong></span>
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Formulario de Solución */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Documentar Solución de Caída">
        <form onSubmit={handleResolveIncident} className="space-y-5 py-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
            Al registrar la solución, el incidente se cerrará globalmente y se notificará el procedimiento a todo el personal.
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Documento de Respaldo</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => documentInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                Adjuntar Evidencia
              </button>
              {attachedFile && <span className="text-xs text-slate-600 font-bold truncate max-w-xs">{attachedFile.name}</span>}
            </div>
            <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Procedimiento Aplicado</label>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} required placeholder={`Paso ${index + 1}`} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm" />
                  {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="text-slate-400 hover:text-red-500 text-xs font-bold px-2">Quitar</button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSteps([...steps, ''])} className="mt-2 text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
              + Agregar Paso
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsResolveModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" isLoading={isSubmitting}>Cerrar Incidente</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL GLOBAL AUTOMÁTICO: Notificación de Cierre de Incidente */}
      <Modal isOpen={!!solvedIncidentPopup} onClose={() => setSolvedIncidentPopup(null)} title="Notificación de Cierre: Incidente Resuelto">
        {solvedIncidentPopup && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <h4 className="text-sm font-bold uppercase tracking-wider">Estatus: Sistema Restablecido</h4>
              <p className="text-xs mt-1">El incidente crítico ha sido solucionado. Se detuvo el impacto operativo.</p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">{solvedIncidentPopup.titulo}</h3>
              <p className="text-xs text-slate-500">Tiempo total fuera de línea: <strong>{solvedIncidentPopup.tiempo_inactividad_minutos} minutos</strong></p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl text-white">
              <h4 className="text-xs font-bold text-cyan-400 mb-2">Bitácora de Remediación:</h4>
              <div className="space-y-2">
                {(solvedIncidentPopup.pasos_solucion || []).map((step: string, i: number) => (
                  <p key={i} className="text-xs text-slate-200 leading-relaxed">
                    <span className="font-bold text-slate-400 mr-1">{i + 1}.</span> {step}
                  </p>
                ))}
              </div>
            </div>

            {solvedIncidentPopup.archivo_url && (
              <a 
                href={solvedIncidentPopup.archivo_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
              >
                Descargar Documentación de Soporte
              </a>
            )}

            <div className="pt-2 flex justify-end text-xs text-slate-400">
              <Button onClick={() => setSolvedIncidentPopup(null)}>Entendido</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}