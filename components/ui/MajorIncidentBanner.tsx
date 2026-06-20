'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function MajorIncidentBanner() {
  const { user, isAuthenticated } = useAuth()
  const [activeIncident, setActiveIncident] = useState<any | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('00:00')

  // Gestión de estado para el modal de resolución
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [steps, setSteps] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Gestión de archivos adjuntos para la solución
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  // Suscripción Realtime para detectar caídas operativas
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
        .single()

      setActiveIncident(data || null)
    }

    fetchActiveIncident()

    const canal = supabase
      .channel('major-incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caidas_masivas' }, () => {
        fetchActiveIncident()
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [user, isAuthenticated])

  // Cronómetro de inactividad en tiempo real (Sincronizado al montaje)
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

  // Controladores de pasos de solución
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
  }
  const removeStep = (index: number) => {
    if (steps.length > 1) setSteps(steps.filter((_, i) => i !== index))
  }

  // Ejecución de la remediación y actualización de base de datos
  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    let finalArchivoUrl = null

    // Procesamiento de carga de evidencia (Storage)
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

    // Cálculo del tiempo total de impacto para auditoría
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

  if (!activeIncident) return null

  return (
    <>
      {/* Banner de Impacto Crítico (Capa Global Z-1000) */}
      <div className="fixed top-0 left-0 w-full z-[1000] bg-red-600 border-b-4 border-red-800 shadow-2xl animate-in slide-in-from-top-full duration-500">
        <div className="px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <span className="flex h-5 w-5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-100 border-2 border-red-600 items-center justify-center">
                <span className="text-red-600 text-[10px] font-black">!</span>
              </span>
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">{activeIncident.titulo}</h2>
              <p className="text-xs font-medium text-red-100 opacity-90">{activeIncident.descripcion}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Tiempo de Impacto</p>
              <p className="text-xl font-mono font-black tabular-nums tracking-tight">{elapsedTime}</p>
            </div>
            <button 
              onClick={() => setIsResolveModalOpen(true)}
              className="px-6 py-2 bg-white text-red-700 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg hover:bg-red-50 transition-colors"
            >
              Documentar Solución
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Resolución Formal */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Resolución de Incidente Mayor">
        <form onSubmit={handleResolveIncident} className="space-y-6 py-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-700 font-medium">Al registrar la solución, el incidente se marcará como <strong className="text-emerald-600">RESUELTO</strong> y el cronómetro de inactividad se detendrá para el reporte de auditoría.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia Documental (Obligatoria o Recomendada)</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => documentInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                Adjuntar Archivo de Solución
              </button>
              {attachedFile && <span className="text-xs text-exodus-600 font-bold truncate max-w-xs">{attachedFile.name}</span>}
            </div>
            <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Procedimiento de Remediación</label>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} required placeholder={`Paso técnico ${index + 1}`} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20 text-sm" />
                  {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="px-3 text-slate-400 hover:text-red-500 font-bold text-xs">Quitar</button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSteps([...steps, ''])} className="mt-3 text-xs text-slate-600 hover:text-slate-900 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
              + Agregar paso adicional
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsResolveModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" isLoading={isSubmitting}>Ejecutar Remediación</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}