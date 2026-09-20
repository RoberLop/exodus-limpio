'use client'

import { useState } from 'react'
import { ErrorCard } from './ErrorCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { areaLabels } from '@/lib/utils'

export function ErrorGrid({ errors, onDelete, onEdit, searchTerm = '' }: any) {
  const [selectedError, setSelectedError] = useState<any | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  const [deleteObservation, setDeleteObservation] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const [isQueryExpanded, setIsQueryExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const { user, isAdmin } = useAuth()

  const erroresFiltrados = (errors || []).filter((e: any) => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const erroresComunes = erroresFiltrados.filter((e: any) => e.prioridad === 'Común')
  const erroresNormales = erroresFiltrados.filter((e: any) => e.prioridad === 'Normal' || !e.prioridad)
  const erroresRaros = erroresFiltrados.filter((e: any) => e.prioridad === 'Raro')

  const formatFecha = (isoString: string) => {
    if (!isoString) return ''
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

  const handleConfirmDelete = async () => {
    setActionError('')
    setActionSuccess('')

    if (isAdmin) {
      if (selectedError) {
        await supabase.from('audit_logs').insert([{
          accion: 'ELIMINADO',
          detalle: `Se eliminó el error: ${selectedError.title}`,
          usuario: user?.name || 'Administrador'
        }])
        
        const { error } = await supabase.from('errors').delete().eq('id', selectedError.id)
        if (!error) {
          setIsConfirming(false)
          setSelectedError(null)
          if (onDelete) onDelete(selectedError.id)
          setActionSuccess('Registro eliminado correctamente.')
        } else {
          setActionError('Error al eliminar en la base de datos.')
        }
      }
    } else {
      if (!deleteObservation) {
        setActionError('La justificación es obligatoria.')
        return
      }
      if (selectedError) {
        const { error } = await supabase.from('solicitudes_cambio').insert([{
          solicitante: user?.name || 'Miembro',
          departamento: user?.department || 'TODOS',
          tipo_solicitud: 'ELIMINAR_TICKET',
          tabla_destino: 'errors',
          registro_id: selectedError.id.toString(),
          observacion: deleteObservation,
          informacion_cambio: selectedError
        }])

        if (!error) {
          setIsConfirming(false)
          setSelectedError(null)
          setDeleteObservation('')
          setActionSuccess('Solicitud de eliminación enviada a Gobernanza.')
        } else {
          setActionError('Error al enviar la solicitud.')
        }
      }
    }
  }

  return (
    <div className="space-y-8">
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
          {actionSuccess}
        </div>
      )}

      {erroresComunes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Comunes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {erroresComunes.map((err: any) => (
              <ErrorCard 
                key={err.id} 
                error={err} 
                onDelete={(e: any) => { setSelectedError(e); setIsConfirming(true); setDeleteObservation(''); setActionError(''); }} 
                onEdit={onEdit} 
              />
            ))}
          </div>
        </div>
      )}

      {erroresNormales.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Estándar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {erroresNormales.map((err: any) => (
              <ErrorCard 
                key={err.id} 
                error={err} 
                onDelete={(e: any) => { setSelectedError(e); setIsConfirming(true); setDeleteObservation(''); setActionError(''); }} 
                onEdit={onEdit} 
              />
            ))}
          </div>
        </div>
      )}

      {erroresRaros.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Raros / Críticos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {erroresRaros.map((err: any) => (
              <ErrorCard 
                key={err.id} 
                error={err} 
                onDelete={(e: any) => { setSelectedError(e); setIsConfirming(true); setDeleteObservation(''); setActionError(''); }} 
                onEdit={onEdit} 
              />
            ))}
          </div>
        </div>
      )}

      {erroresFiltrados.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No se encontraron registros que coincidan con la búsqueda.
        </div>
      )}

      <Modal isOpen={isConfirming} onClose={() => setIsConfirming(false)} title={isAdmin ? "Confirmar Eliminación" : "Solicitar Eliminación de Ticket"}>
        <div className="space-y-4 py-2 text-left">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
            {isAdmin 
              ? `¿Estás seguro de eliminar permanentemente el registro "${selectedError?.title}"? Esta acción no se puede deshacer.`
              : `Vas a enviar una solicitud a Gobernanza para eliminar el registro "${selectedError?.title}".`}
          </div>

          {!isAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Justificación del cambio *</label>
              <textarea 
                placeholder="Explica el motivo de la eliminación..." 
                value={deleteObservation} 
                onChange={(e) => { setDeleteObservation(e.target.value); setActionError(''); }} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-500/20 outline-none text-sm" 
                rows={3} 
                autoFocus 
              />
            </div>
          )}

          {actionError && (
            <p className="text-red-500 text-xs font-semibold text-center">{actionError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsConfirming(false)}>
              Cancelar
            </Button>
            <Button type="button" className={`flex-1 ${isAdmin ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`} onClick={handleConfirmDelete}>
              {isAdmin ? 'Eliminar Definitivo' : 'Enviar Solicitud'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}