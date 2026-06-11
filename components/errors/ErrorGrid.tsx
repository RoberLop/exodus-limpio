'use client'

import { useState } from 'react'
import { ErrorCard } from './ErrorCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function ErrorGrid({ errors, onDelete, onEdit }: any) {
  const [selectedError, setSelectedError] = useState<any | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  // --- NUEVO: Estado para el texto del buscador ---
  const [searchTerm, setSearchTerm] = useState('')

  // --- NUEVO: Primero filtramos por lo que escribes en el buscador ---
  const erroresFiltrados = errors.filter((e: any) => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Luego los separamos por prioridad (usando la lista ya filtrada)
  const erroresComunes = erroresFiltrados.filter((e: any) => e.prioridad === 'Común')
  const erroresNormales = erroresFiltrados.filter((e: any) => e.prioridad === 'Normal' || !e.prioridad)
  const erroresRaros = erroresFiltrados.filter((e: any) => e.prioridad === 'Raro')

  return (
    <>
      <div className="space-y-8">
        
        {/* --- NUEVO: Barra de Búsqueda --- */}
        {errors.length > 0 && (
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Buscar por título, código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-700"
            />
          </div>
        )}

        {/* --- RESULTADOS VACÍOS DEL BUSCADOR --- */}
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
                <ErrorCard 
                  key={error.id} 
                  error={error} 
                  onClick={() => setSelectedError(error)} 
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}

        {erroresNormales.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Normales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {erroresNormales.map((error: any) => (
                <ErrorCard 
                  key={error.id} 
                  error={error} 
                  onClick={() => setSelectedError(error)} 
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}

        {erroresRaros.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Raros</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {erroresRaros.map((error: any) => (
                <ErrorCard 
                  key={error.id} 
                  error={error} 
                  onClick={() => setSelectedError(error)} 
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL (Intacto) --- */}
      <Modal isOpen={!!selectedError} onClose={() => { setSelectedError(null); setIsConfirming(false); }} title={selectedError?.title || ''}>
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