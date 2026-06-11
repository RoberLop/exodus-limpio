'use client'

import { useState } from 'react'
import { ErrorCard } from './ErrorCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function ErrorGrid({ errors, onDelete }: any) {
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
            {selectedError.screenshotUrl && (
              <img src={selectedError.screenshotUrl} className="w-full rounded-lg shadow-lg" />
            )}
            <p className="text-slate-600">{selectedError.description}</p>
            <div className="bg-slate-900 p-4 rounded-xl text-white">
              <h4 className="font-bold">Pasos de Solución:</h4>
              {(selectedError.steps || []).map((step: string, i: number) => (
                <p key={i}>{i + 1}. {step}</p>
              ))}
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setIsConfirming(true)} 
                className="text-red-500 hover:text-red-700 text-sm font-bold border-b border-red-500"
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