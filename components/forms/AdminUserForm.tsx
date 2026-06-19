'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { supabase } from '@/lib/supabase'

interface AdminUserFormProps {
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export function AdminUserForm({ initialData, onSuccess, onCancel }: AdminUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const [name, setName] = useState(initialData?.name || '')
  const [username, setUsername] = useState(initialData?.username || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [password, setPassword] = useState(initialData?.password || '')
  const [role, setRole] = useState(initialData?.role || 'user')
  const [departments, setDepartments] = useState<string[]>(initialData?.departments || ['CAE'])

  const isEditing = !!initialData?.id

  const roleOptions = [
    { value: 'user', label: 'Usuario (Solo ver y crear tickets)' },
    { value: 'admin', label: 'Administrador (Acceso total)' }
  ]

  const toggleDepartment = (dept: string) => {
    if (departments.includes(dept)) {
      // Evitar que se quede sin ningún departamento
      if (departments.length > 1) {
        setDepartments(departments.filter(d => d !== dept))
      }
    } else {
      setDepartments([...departments, dept])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Limpiamos el username para que siempre esté en minúsculas y sin espacios extra
    const cleanUsername = username.toLowerCase().trim()

    const payload = {
      name,
      username: cleanUsername,
      email,
      password,
      role,
      departments
    }

    let error;

    if (isEditing) {
      const { error: updateError } = await supabase.from('usuarios').update(payload).eq('id', initialData.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('usuarios').insert([payload])
      error = insertError
    }

    if (error) {
      console.error('Error al guardar usuario:', error)
      alert(error.message?.includes('duplicate key') ? 'Ese nombre de usuario ya existe. Elige otro.' : 'Error al guardar el usuario.')
    } else {
      onSuccess()
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input 
        label="Nombre Completo" 
        placeholder="Ej: Juan Pérez" 
        required 
        value={name} 
        onChange={(e: any) => setName(e.target.value)} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Usuario (Login)" 
          placeholder="Ej: juan cae" 
          required 
          value={username} 
          onChange={(e: any) => setUsername(e.target.value)} 
          disabled={isEditing} // No dejamos cambiar el username si está editando para evitar errores
        />
        <Input 
          label="Contraseña" 
          placeholder="••••••••" 
          required 
          value={password} 
          onChange={(e: any) => setPassword(e.target.value)} 
        />
      </div>

      <Input 
        label="Correo Electrónico" 
        type="email"
        placeholder="juan@exodus.com" 
        value={email} 
        onChange={(e: any) => setEmail(e.target.value)} 
      />

      <Select 
        label="Rol del Sistema" 
        value={role} 
        onChange={setRole} 
        options={roleOptions} 
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Áreas Permitidas</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full">
            <input 
              type="checkbox" 
              checked={departments.includes('CAE')}
              onChange={() => toggleDepartment('CAE')}
              className="w-5 h-5 text-exodus-600 rounded border-slate-300 focus:ring-exodus-500"
            />
            <span className="text-sm font-medium text-slate-700">Soporte CAE</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full">
            <input 
              type="checkbox" 
              checked={departments.includes('TI')}
              onChange={() => toggleDepartment('TI')}
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Operaciones TI</span>
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Selecciona a qué áreas tendrá acceso este usuario al iniciar sesión.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  )
}