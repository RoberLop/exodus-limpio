'use client'

import { useState } from 'react'
import { ErrorCard } from './ErrorCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function ErrorGrid({ errors, onDelete, onEdit }: any) {
  const [selectedError, setSelectedError] = useState<any | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {errors.map((error: any) => (
          <ErrorCard 
            key={error.id} 
            error={error} 
            onClick={() => setSelectedError(error)} 
            onDelete={onDelete}
          />
        ))}
      </div>

      <Modal isOpen={!!selectedError} onClose={() => { setSelectedError(null); setIsConfirming(false); }} title={selectedError?.title || ''}>
        {selectedError && !isConfirming && (
          <div className="space-y-4">
            
            {/* --- NUEVO: Etiquetas de Prioridad y Origen --- */}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedError.prioridad && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  {selectedError.prioridad}
                </span>
              )}
              {selectedError.origen && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedError.origen}
                </span>
              )}
            </div>

            {selectedError.screenshotUrl && (
              <img src={selectedError.screenshotUrl} className="w-full rounded-lg shadow-lg" />
            )}
            
            <p className="text-slate-600">{selectedError.description}</p>
            
            <div className="bg-slate-900 p-4 rounded-xl text-white">
              <h4 className="font-bold mb-2">Pasos de Solución:</h4>
              {(selectedError.steps || []).map((step: string, i: number) => (
                <p key={i} className="text-sm text-slate-200">{i + 1}. {step}</p>
              ))}
            </div>

            {/* --- NUEVO: Bloque de Query (Solo se muestra si hay texto) --- */}
            {selectedError.solucion_query && (
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700">
                <h4 className="font-bold text-slate-300 mb-2 text-sm flex items-center gap-2">
                  <span>💻</span> Query / Técnico:
                </h4>
                <pre className="text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {selectedError.solucion_query}
                </pre>
              </div>
            )}
            
            {/* --- NUEVO: Contenedor dividido para Editar y Eliminar --- */}
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
              <button 
                onClick={() => {
                  if (onEdit) onEdit(selectedError);
                  setSelectedError(null);
                }} 
                className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors"
              >
                ✏️ Editar Ticket
              </button>

              <button 
                onClick={() => setIsConfirming(true)} 
                className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors"
              >
                Eliminar Ticket
              </button>
            </div>
          </div>
        )}
        
        {isConfirming && (
          <div className="p-8 text-center space-y-4">
            <h3 className="text-lg font-bold">¿Estás seguro de eliminar este ticket?</h3>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="secondary" onClick={() => setIsConfirming(false)}>Cancelar</Button>
              <Button 
                className="bg-red-600 hover:bg-red-700" 
                onClick={() => { 
                  onDelete(selectedError.id); 
                  setSelectedError(null); 
                  setIsConfirming(false); 
                }}
              >
                Sí, borrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}