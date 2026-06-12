'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('fecha', { ascending: false })
    
    if (error) {
      console.error('Error al cargar los logs:', error)
    } else if (data) {
      setLogs(data)
    }
    setIsLoading(false)
  }

  const formatFecha = (isoString: string) => {
    const fecha = new Date(isoString)
    return fecha.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getActionColor = (accion: string) => {
    switch (accion) {
      case 'CREADO':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      case 'EDITADO':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'ELIMINADO':
        return 'bg-red-50 text-red-600 border-red-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Auditoria</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro de todos los movimientos de tickets en el sistema.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar tabla'}
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha y Hora</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accion</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                    Cargando historial...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                    No hay registros en el historial todavia.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/60 transition-colors">
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatFecha(log.fecha)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getActionColor(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-800">
                      {log.ticket_titulo}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {log.usuario}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}