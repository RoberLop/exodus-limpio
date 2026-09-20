'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ErrorGrid } from '@/components/errors/ErrorGrid'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { NewErrorForm } from '@/components/forms/NewErrorForm'
import { useAuth } from '@/context/AuthContext'

export function ErrorAreaPage({ areaName }: { areaName: string }) {
  const { user } = useAuth()
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
      .eq('departamento', user.department) // Solo trae los de su departamento
    
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

  // --- LA MAGIA DEL TIEMPO REAL ---
  useEffect(() => { 
    fetchErrors() 

    if (!user?.department) return

    // Creamos el canal para escuchar la base de datos en vivo
    const canalRealtime = supabase
      .channel('cambios-en-errores')
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha inserts, updates y deletes
          schema: 'public',
          table: 'errors'
        },
        (payload) => {
          console.log('¡Cambio detectado en tiempo real!', payload)
          // Cuando alguien más cambie algo, recargamos la lista automáticamente
          fetchErrors()
        }
      )
      .subscribe()

    // Limpieza de memoria cuando el usuario cambie de pestaña
    return () => {
      supabase.removeChannel(canalRealtime)
    }
  }, [areaName, user?.department])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('errors').delete().eq('id', id)
    if (error) {
      alert("No se pudo eliminar el ticket: " + error.message)
    } else {
      // Ya no es estrictamente necesario llamar a fetchErrors aquí, 
      // porque el Realtime lo va a detectar y lo hará por nosotros, 
      // pero dejarlo no hace daño para que sea instantáneo para ti.
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