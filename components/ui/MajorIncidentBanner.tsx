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

  // Ajustar el índice si la lista de incidentes cambia o se reduce
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
      {/* Tinte global ambiental */}
      <div className="fixed inset-0 bg-red-600/10 mix-blend-multiply pointer-events-none z-[9998]" />

      {/* Banner de Control Glassmorphism con Soporte de Carrusel */}
      <div className="fixed top-6 right-6 left-[310px] z-[9999] bg-red-950/80 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl shadow-red-900/20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Controles de navegación si hay más de una caída activa */}
            {incidents.length > 1 && (
              <div className="flex items-center gap-1.5 bg-red-900/40 p-1 rounded-xl border border-red-500/20 shrink-0">
                <button 
                  onClick={() => setCurrentIndex((prev) => (prev === 0 ? incidents.length - 1 : prev - 1))}
                  className="p-1 hover:bg-red-800/50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-[10px] font-mono font-bold px-1 select-none">
                  {currentIndex + 1}/{incidents.length}
                </span>
                <button 
                  onClick={() => setCurrentIndex((prev) => (prev === incidents.length - 1 ? 0 : prev + 1))}
                  className="p-1 hover:bg-red-800/50 rounded-lg transition-colors"
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
                  {activeIncident.titulo}
                  <span className="text-[10px] font-bold bg-red-900/60 border border-red-500/30 px-2 py-0.5 rounded-md text-red-200">Detalles</span>
                </h2>
                <p className="text-xs text-red-200/70 font-medium line-clamp-1 mt-0.5">{activeIncident.descripcion}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-[9px] font-bold text-red-400/90 uppercase tracking-widest">Inactividad Total</p>
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

      {/* Los modales de Detalle, Solución y SolvedIncidentPopup permanecen idénticos al archivo anterior... */}
    </>
  )
}