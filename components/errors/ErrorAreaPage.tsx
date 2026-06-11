'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ErrorGrid } from '@/components/errors/ErrorGrid'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal' // <-- NUEVO: Importamos tu Modal
import { NewErrorForm } from '@/components/forms/NewErrorForm' // <-- Verifica que esta ruta apunte a tu formulario

export function ErrorAreaPage({ areaName }: { areaName: string }) {
  const [errors, setErrors] = useState<any[]>([])
  
  // --- NUEVO: Estado para saber qué ticket estamos editando ---
  const [editingError, setEditingError] = useState<any | null>(null)

  const fetchErrors = async () => {
    const { data } = await supabase
      .from('errors')
      .select('*')
      .eq('area', areaName)
      .order('created_at', { ascending: false })
    
    if (data) {
      setErrors(data.map(item => ({ ...item, screenshotUrl: item.screenshot_url })))
    }
  }

  useEffect(() => { fetchErrors() }, [areaName])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('errors').delete().eq('id', id)
    if (error) {
      alert("No se pudo eliminar el ticket: " + error.message)
    } else {
      fetchErrors() // Recarga la lista automáticamente
    }
  }

  return (
    <div>
      <Header area={areaName as any} errorCount={errors.length} onAddError={fetchErrors} />
      
      {/* Pasamos handleDelete y el NUEVO onEdit al Grid */}
      <ErrorGrid 
        errors={errors} 
        onDelete={handleDelete} 
        onEdit={(error: any) => setEditingError(error)} 
      />

      {/* --- NUEVO: Modal flotante exclusivo para la edición --- */}
      <Modal 
        isOpen={!!editingError} 
        onClose={() => setEditingError(null)} 
        title="Editar Ticket"
      >
        {editingError && (
          <NewErrorForm 
            area={areaName as any} 
            initialData={editingError} // Le pasamos los datos del ticket al form
            onSuccess={() => {
              setEditingError(null) // Cerramos el modal
              fetchErrors() // Recargamos los tickets para ver los cambios
            }}
            onCancel={() => setEditingError(null)} 
          />
        )}
      </Modal>
    </div>
  )
}