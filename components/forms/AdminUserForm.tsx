'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/SelectMenu'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface AdminUserFormProps {
  initialData?: any
  onSuccess: (message: string) => void
  onCancel: () => void
  onRequestPassword?: (user: any) => void // Prop nueva para el "ojito"
}

export function AdminUserForm({ initialData, onSuccess, onCancel, onRequestPassword }: AdminUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { user, isSuperAdmin } = useAuth()
  
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
    setFormError('')
    
    const cleanUsername = username.toLowerCase().trim()

    const payload = {
      name,
      username: cleanUsername,
      email,
      password,
      role,
      departments
    }

    if (isSuperAdmin) {
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
        setFormError(error.message?.includes('duplicate key') ? 'Ese nombre de usuario ya existe. Elige otro.' : 'Error al guardar el usuario.')
      } else {
        onSuccess(isEditing ? 'Perfil de usuario actualizado correctamente.' : 'Usuario creado con éxito en el sistema.')
      }
    } else {
      const tipoAccion = isEditing ? 'EDITAR_USUARIO' : 'CREAR_USUARIO'
      
      const { error } = await supabase.from('solicitudes_cambio').insert([{
        solicitante: user?.name || 'Administrador',
        departamento: user?.department || 'TODOS',
        tipo_solicitud: tipoAccion,
        tabla_destino: 'usuarios',
        registro_id: isEditing ? initialData.id.toString() : 'NUEVO',
        observacion: `Solicitud de validación para ${isEditing ? 'editar' : 'crear'} perfil de usuario.`,
        informacion_cambio: payload
      }])

      if (error) {
        setFormError('Error al generar la solicitud de autorización: ' + error.message)
      } else {
        onSuccess('Solicitud enviada a la bandeja de Gobernanza TI.')
      }
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">
          {formError}
        </div>
      )}

      <Input label="Nombre Completo" placeholder="Ej: Juan Pérez" required value={name} onChange={(e: any) => setName(e.target.value)} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Usuario (Login)" placeholder="Ej: juan cae" required value={username} onChange={(e: any) => setUsername(e.target.value)} disabled={isEditing} />
        
        {/* LA CAJA DE CONTRASEÑA BLINDADA */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Contraseña</label>
          <div className="relative">
            <input
              type={!isSuperAdmin && isEditing ? "password" : "text"}
              placeholder="••••••••"
              required
              value={!isSuperAdmin && isEditing ? "********" : password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!isSuperAdmin && isEditing}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-exodus-500/20 outline-none transition-all text-sm pr-10 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {/* EL "OJITO" DE SOLICITUD */}
            {!isSuperAdmin && isEditing && (
              <button
                type="button"
                onClick={() => onRequestPassword && onRequestPassword(initialData)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-all shadow-sm border border-slate-100"
                title="Solicitar ver credencial a Gobernanza"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <Input label="Correo Electrónico" type="email" placeholder="juan@exodus.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />

      <Select label="Rol del Sistema" value={role} onChange={setRole} options={roleOptions} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Áreas Permitidas</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full">
            <input type="checkbox" checked={departments.includes('CAE')} onChange={() => toggleDepartment('CAE')} className="w-5 h-5 text-exodus-600 rounded border-slate-300 focus:ring-exodus-500" />
            <span className="text-sm font-medium text-slate-700">Soporte CAE</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full">
            <input type="checkbox" checked={departments.includes('TI')} onChange={() => toggleDepartment('TI')} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
            <span className="text-sm font-medium text-slate-700">Operaciones TI</span>
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Selecciona a qué áreas tendrá acceso este usuario al iniciar sesión.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {!isSuperAdmin ? 'Enviar Solicitud' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
        </Button>
      </div>
    </form>
  )
}