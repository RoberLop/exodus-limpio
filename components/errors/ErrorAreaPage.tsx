'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ErrorGrid } from '@/components/errors/ErrorGrid'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { NewErrorForm } from '@/components/forms/NewErrorForm'

export function ErrorAreaPage({ areaName }: { areaName: string }) {
  const [errors, setErrors] = useState<any[]>([])
  const [editingError, setEditingError] = useState<any | null>(null)
  
  // --- NUEVO: Aquí guardamos lo que escribes en el buscador ---
  const [searchTerm, setSearchTerm] = useState('')

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
      fetchErrors()
    }
  }

  return (
    <div>
      {/* Pasamos el searchTerm y onSearchChange al Header */}
      <Header 
        area={areaName as any} 
        errorCount={errors.length} 
        onAddError={fetchErrors} 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      {/* Pasamos el mismo searchTerm al Grid para que filtre */}
      <ErrorGrid 
        errors={errors} 
        onDelete={handleDelete} 
        onEdit={(error: any) => setEditingError(error)} 
        searchTerm={searchTerm}
      />

      <Modal 
        isOpen={!!editingError} 
        onClose={() => setEditingError(null)} 
        title="Editar Ticket"
      >
        {editingError && (
          <NewErrorForm 
            area={areaName as any} 
            initialData={editingError} 
            onSuccess={() => {
              setEditingError(null)
              fetchErrors()
            }}
            onCancel={() => setEditingError(null)} 
          />
        )}
      </Modal>
    </div>
  )
}