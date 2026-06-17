'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ErrorGrid } from '@/components/errors/ErrorGrid'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { NewErrorForm } from '@/components/forms/NewErrorForm'
import { useAuth } from '@/context/AuthContext' // <-- 1. Importamos tu AuthContext

export function ErrorAreaPage({ areaName }: { areaName: string }) {
  const { user } = useAuth() // <-- 2. Obtenemos al usuario conectado
  const [errors, setErrors] = useState<any[]>([])
  const [editingError, setEditingError] = useState<any | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')

  const fetchErrors = async () => {
    // Si por alguna razón el usuario aún no carga en pantalla, esperamos
    if (!user?.department) return

    // 1. Preparamos la consulta base (traer todo ordenado por fecha)
    let query = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false })
      .eq('departamento', user.department) // <-- 3. LA MAGIA: Solo trae los de su departamento
    
    // 2. Si NO estamos en la pestaña global, le aplicamos el filtro del área
    if (areaName !== 'global') {
      query = query.eq('area', areaName)
    }

    // 3. Ejecutamos la consulta
    const { data } = await query
    
    if (data) {
      setErrors(data.map(item => ({ ...item, screenshotUrl: item.screenshot_url })))
    }
  }

  // 4. Agregamos el user.department a la lista de dependencias para que recargue si cambia de usuario
  useEffect(() => { fetchErrors() }, [areaName, user?.department])

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
      <Header 
        area={areaName as any} 
        errorCount={errors.length} 
        onAddError={fetchErrors} 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
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