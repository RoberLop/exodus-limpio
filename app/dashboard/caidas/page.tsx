'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export default function HistorialCaidasPage() {
  const { user, isAuthenticated } = useAuth()
  const [incidentes, setIncidentes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchIncidentes = async () => {
      const { data } = await supabase
        .from('caidas_masivas')
        .select('*')
        .eq('estado', 'RESUELTO')
        .or(`departamento.eq.TODOS,departamento.eq.${user.department}`)
        .order('resuelto_at', { ascending: false })

      if (data) setIncidentes(data)
      setIsLoading(false)
    }

    fetchIncidentes()
  }, [user, isAuthenticated])

  const formatFecha = (isoString: string) => {
    if (!isoString) return ''
    return new Date(isoString).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Caídas Masivas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro histórico de incidentes críticos y sus procedimientos de remediación.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-slate-400 font-medium animate-pulse">Cargando bitácoras...</p>
        </div>
      ) : incidentes.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border border-slate-200/50">
          <span className="text-4xl">✅</span>
          <h3 className="text-lg font-bold text-slate-800 mt-4">Sistema Operativo</h3>
          <p className="text-slate-500 mt-2">No se han registrado incidentes mayores en esta área.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {incidentes.map((incidente) => (
            <div 
              key={incidente.id} 
              onClick={() => setSelectedIncident(incidente)}
              className="glass p-5 rounded-3xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border bg-red-50 text-red-600 border-red-100">
                  {incidente.departamento === 'TODOS' ? 'Global' : incidente.departamento}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {incidente.tiempo_inactividad_minutos} min
                </span>
              </div>
              
              <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                {incidente.titulo}
              </h3>
              
              <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-slate-100 mt-4">
                <p className="text-[10px] text-slate-400 font-medium">
                  Fecha: {formatFecha(incidente.resuelto_at)}
                </p>
                <p className="text-[10px] text-slate-500 font-bold">
                  Resuelto por: {incidente.resuelto_por}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalle de Incidente Histórico */}
      <Modal isOpen={!!selectedIncident} onClose={() => setSelectedIncident(null)} title="Bitácora de Cierre de Incidente">
        {selectedIncident && (
          <div className="space-y-5 py-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-base font-black text-slate-900">{selectedIncident.titulo}</h3>
              <p className="text-sm text-slate-600 mt-1">{selectedIncident.descripcion}</p>
              <div className="mt-3 flex gap-4 text-xs font-bold">
                <span className="text-red-600">Impacto: {selectedIncident.tiempo_inactividad_minutos} minutos</span>
                <span className="text-slate-500">Reportado por: {selectedIncident.creado_por}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl shadow-inner border border-slate-800 text-white">
              <h4 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-wider">Procedimiento Aplicado</h4>
              <div className="space-y-2">
                {(selectedIncident.pasos_solucion || []).map((step: string, i: number) => (
                  <p key={i} className="text-sm text-slate-200 leading-relaxed font-medium">
                    <span className="font-black text-slate-500 mr-2">{i + 1}.</span> {step}
                  </p>
                ))}
              </div>
            </div>

            {selectedIncident.archivo_url && (
              <a 
                href={selectedIncident.archivo_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar Documentación Anexa
              </a>
            )}

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-xs text-slate-400 font-bold">
                Resolución: {formatFecha(selectedIncident.resuelto_at)}
              </span>
              <Button onClick={() => setSelectedIncident(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}