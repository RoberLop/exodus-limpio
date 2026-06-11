'use client'

import { useState } from 'react'
import { ErrorCard } from './ErrorCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function ErrorGrid({ errors, onDelete, onEdit, searchTerm = '' }: any) {
  const [selectedError, setSelectedError] = useState<any | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  // --- NUEVOS ESTADOS PARA LA CONTRASEÑA ---
  const [deletePassword, setDeletePassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  // Filtramos por el texto que viene del Header
  const erroresFiltrados = (errors || []).filter((e: any) => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const erroresComunes = erroresFiltrados.filter((e: any) => e.prioridad === 'Común')
  const erroresNormales = erroresFiltrados.filter((e: any) => e.prioridad === 'Normal' || !e.prioridad)
  const erroresRaros = erroresFiltrados.filter((e: any) => e.prioridad === 'Raro')

  // --- FUNCIÓN PARA VALIDAR Y BORRAR ---
  const handleConfirmDelete = () => {
    // CONTRASEÑA ACTUALIZADA A 3x0du5
    if (deletePassword === '3x0du5') { 
      onDelete(selectedError.id);
      setSelectedError(null);
      setIsConfirming(false);
      setDeletePassword('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  return (
    <>
      <div className="space-y-8">
        
        {searchTerm && erroresFiltrados.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
            No se encontraron tickets que coincidan con "<strong>{searchTerm}</strong>".
          </div>
        )}

        {erroresComunes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Comunes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {erroresComunes.map((error: any) => (
                <ErrorCard key={error.id} error={error} onClick={() => setSelectedError(error)} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}

        {erroresNormales.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Normales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {erroresNormales.map((error: any) => (
                <ErrorCard key={error.id} error={error} onClick={() => setSelectedError(error)} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}

        {erroresRaros.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Raros</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {erroresRaros.map((error: any) => (
                <ErrorCard key={error.id} error={error} onClick={() => setSelectedError(error)} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}

      </div>

      <Modal isOpen={!!selectedError} onClose={() => { setSelectedError(null); setIsConfirming(false); setDeletePassword(''); setPasswordError(false); }} title={selectedError?.title || ''}>
        {selectedError && !isConfirming && (
          <div className="space-y-4">
            
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
        
        {/* --- MODAL DE CONFIRMACIÓN CON CONTRASEÑA --- */}
        {isConfirming && (
          <div className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold text-slate-800">¿Estás seguro?</h3>
            <p className="text-sm text-slate-500">Ingresa la contraseña maestra para eliminar este ticket.</p>
            
            <div className="max-w-xs mx-auto mt-4">
              <input
                type="password"
                placeholder="Contraseña..."
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value)
                  setPasswordError(false)
                }}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all ${passwordError ? 'border-red-500' : 'border-slate-200'}`}
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">
                  Contraseña incorrecta
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-center mt-6">
              <Button 
                variant="secondary" 
                onClick={() => { 
                  setIsConfirming(false); 
                  setDeletePassword(''); 
                  setPasswordError(false); 
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700" 
                onClick={handleConfirmDelete}
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