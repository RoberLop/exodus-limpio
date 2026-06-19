'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/SelectMenu'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface AdminAnnounceFormProps {
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export function AdminAnnounceForm({ initialData, onSuccess, onCancel }: AdminAnnounceFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  // Si initialData tiene información, la precargamos. Si no, va vacío.
  const [titulo, setTitulo] = useState(initialData?.titulo || '')
  const [mensaje, setMensaje] = useState(initialData?.mensaje || '')
  const [departamento, setDepartamento] = useState(initialData?.departamento || 'TODOS')
  const [importancia, setImportancia] = useState(initialData?.importancia || 'Normal')

  const isEditing = !!initialData?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = { titulo, mensaje, departamento, importancia }
    let error;

    if (isEditing) {
      // Si estamos editando, actualizamos en la base de datos
      const { error: updateError } = await supabase.from('anuncios').update(payload).eq('id', initialData.id)
      error = updateError
    } else {
      // Si es nuevo, lo insertamos y le ponemos la firma de quien lo creó
      const { error: insertError } = await supabase.from('anuncios').insert([{ ...payload, creado_por: user?.name }])
      error = insertError
    }

    if (error) {
      console.error('Error al guardar anuncio:', error)
      alert('Error al guardar: ' + error.message)
    } else {
      onSuccess()
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Título" required value={titulo} onChange={(e: any) => setTitulo(e.target.value)} />
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensaje</label>
        <textarea required rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-exodus-500/20 outline-none transition-all" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Dirigido a" value={departamento} onChange={setDepartamento} options={[
          { value: 'TODOS', label: 'Global (Todos)' },
          { value: 'CAE', label: 'Soporte CAE' },
          { value: 'TI', label: 'Operaciones TI' }
        ]} />
        <Select label="Importancia" value={importancia} onChange={setImportancia} options={[
          { value: 'Normal', label: 'Normal' },
          { value: 'Alta', label: 'Alta Prioridad' }
        ]} />
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {isEditing ? 'Guardar Cambios' : 'Publicar Anuncio'}
        </Button>
      </div>
    </form>
  )
}