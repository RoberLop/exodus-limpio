'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/select' 
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function AdminAnnounceForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [departamento, setDepartamento] = useState('TODOS')
  const [importancia, setImportancia] = useState('Normal')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.from('anuncios').insert([{
      titulo,
      mensaje,
      departamento,
      importancia,
      creado_por: user?.name
    }])

    if (error) alert('Error al publicar: ' + error.message)
    else onSuccess()
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Título" required value={titulo} onChange={(e: any) => setTitulo(e.target.value)} />
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensaje</label>
        <textarea required rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Dirigido a" value={departamento} onChange={setDepartamento} options={[
          { value: 'TODOS', label: 'Todos' },
          { value: 'CAE', label: 'Soporte CAE' },
          { value: 'TI', label: 'Operaciones TI' }
        ]} />
        <Select label="Importancia" value={importancia} onChange={setImportancia} options={[
          { value: 'Normal', label: 'Normal' },
          { value: 'Alta', label: 'Alta Prioridad' }
        ]} />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>Publicar Anuncio</Button>
      </div>
    </form>
  )
}