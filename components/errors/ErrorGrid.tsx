'use client'

import { useState } from 'react'
import { ErrorCard } from './ErrorCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { areaLabels } from '@/lib/utils' // --- NUEVO: Para traer los nombres bonitos de las áreas ---

export function ErrorGrid({ errors, onDelete, onEdit, searchTerm = '' }: any) {
  const [selectedError, setSelectedError] = useState<any | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  const [deletePassword, setDeletePassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const [isQueryExpanded, setIsQueryExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const { user } = useAuth()

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
    if (deletePassword === 'isAdmin02') { 
      if (selectedError) {
        await supabase.from('audit_logs').insert([{
          accion: 'ELIMINADO',
          ticket_titulo: selectedError.title,
          usuario: user?.name || 'Desconocido'
        }]);
      }

      onDelete(selectedError.id);
      handleCloseModal();
    } else {
      setPasswordError(true);
    }
  }

  const handleCloseModal = () => {
    setSelectedError(null);
    setIsConfirming(false);
    setDeletePassword('');
    setPasswordError(false);
    setIsQueryExpanded(false);
    setIsCopied(false);
  }

  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); 
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

      <Modal isOpen={!!selectedError} onClose={handleCloseModal} title={selectedError?.title || ''}>
        
        {selectedError && !isConfirming && !isQueryExpanded && (
          <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-200">
            
            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex flex-wrap gap-2">
                {/* --- NUEVO: Etiqueta del Área Operativa --- */}
                {selectedError.area && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-exodus-50 text-exodus-600 border border-exodus-100">
                    {areaLabels[selectedError.area] || selectedError.area}
                  </span>
                )}
                {/* ------------------------------------------ */}
                
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
                <img src={selectedError.screenshotUrl} className="w-full rounded-lg shadow-sm border border-slate-200" />
              )}

              {selectedError.solucion_query && (
                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-slate-300 text-sm flex items-center gap-2">
                      Query / Técnico
                    </h4>
                    <button 
                      onClick={() => setIsQueryExpanded(true)}
                      className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors px-2 py-1 rounded flex items-center gap-1 text-xs font-bold"
                    >
                      Ampliar
                    </button>
                  </div>
                  
                  <div 
                    className="relative max-h-24 overflow-hidden cursor-pointer group rounded"
                    onClick={() => setIsQueryExpanded(true)}
                  >
                    <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap break-all opacity-70 group-hover:opacity-100 transition-opacity">
                      {selectedError.solucion_query}
                    </pre>
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0f172a] to-transparent flex items-end justify-center pb-1">
                      <span className="text-xs text-blue-400 font-bold bg-[#0f172a] px-3 py-1 rounded-full border border-slate-700 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                        Ver Query completa
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 flex flex-col space-y-4">
              <p className="text-slate-600 text-sm">{selectedError.description}</p>
              
              <div className="bg-slate-900 p-4 rounded-xl text-white flex-1">
                <h4 className="font-bold mb-3 text-sm text-blue-400">Pasos de Solución:</h4>
                <div className="space-y-2">
                  {(selectedError.steps || []).map((step: string, i: number) => (
                    <p key={i} className="text-sm text-slate-200 leading-relaxed">
                      <span className="font-bold text-slate-400 mr-1">{i + 1}.</span> {step}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-3 mt-auto border-t border-slate-100">
                <div className="flex flex-col gap-1 text-xs text-slate-400">
                  {selectedError.creado_por && (
                    <span>
                      Creado por: <strong className="text-slate-500">{selectedError.creado_por}</strong> 
                      {selectedError.created_at && ` el ${formatFecha(selectedError.created_at)}`}
                    </span>
                  )}
                  {selectedError.modificado_por && (
                    <span>
                      Editado por: <strong className="text-slate-500">{selectedError.modificado_por}</strong>
                      {selectedError.updated_at && ` el ${formatFecha(selectedError.updated_at)}`}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => {
                      if (onEdit) onEdit(selectedError);
                      handleCloseModal();
                    }} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    Editar Ticket
                  </button>

                  <button 
                    onClick={() => setIsConfirming(true)} 
                    className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors"
                  >
                    Eliminar Ticket
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {selectedError && !isConfirming && isQueryExpanded && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Vista Completa de Query
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopyQuery(selectedError.solucion_query)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm ${isCopied ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  {isCopied ? 'Copiado' : 'Copiar Query'}
                </button>
                <button 
                  onClick={() => setIsQueryExpanded(false)}
                  className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  Volver atrás
                </button>
              </div>
            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-700 max-h-[60vh] overflow-y-auto custom-scrollbar shadow-inner">
              <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
                {selectedError.solucion_query}
              </pre>
            </div>
          </div>
        )}
        
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
              <Button variant="secondary" onClick={() => { setIsConfirming(false); setDeletePassword(''); setPasswordError(false); }}>
                Cancelar
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete}>
                Sí, borrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}