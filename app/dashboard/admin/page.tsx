'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AdminUserForm } from '@/components/forms/AdminUserForm'

export default function AdminPage() {
  const { isAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // --- NUEVOS ESTADOS PARA BÚSQUEDA Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState<'TODOS' | 'CAE' | 'TI'>('TODOS')

  // Estados para el Modal de Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)

  // Estados para el Modal de ELIMINAR
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isAdmin) fetchUsuarios()
  }, [isAdmin])

  const fetchUsuarios = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('usuarios').select('*').order('id', { ascending: true })
    if (error) console.error('Error al cargar usuarios:', error)
    else if (data) setUsuarios(data)
    setIsLoading(false)
  }

  // --- LÓGICA DE FILTRADO INTELIGENTE ---
  const filteredUsers = usuarios.filter((u) => {
    // 1. Filtro de búsqueda (busca por nombre, usuario o correo)
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))

    // 2. Filtro de departamento
    const matchesDept = 
      filterDept === 'TODOS' ? true : u.departments?.includes(filterDept)

    return matchesSearch && matchesDept
  })

  const confirmDelete = (user: any) => {
    setUserToDelete(user)
    setDeletePassword('')
    setDeleteError('')
    setIsDeleteModalOpen(true)
  }

  const executeDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deletePassword !== 'isAdmin02') {
      setDeleteError('Contraseña maestra incorrecta.')
      return
    }
    setIsDeleting(true)
    const { error } = await supabase.from('usuarios').delete().eq('id', userToDelete.id)
    setIsDeleting(false)

    if (error) {
      alert('Error al eliminar: ' + error.message)
    } else {
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
      fetchUsuarios()
    }
  }

  const openNewUserModal = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const openEditUserModal = (user: any) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Acceso Denegado</h2>
        <p className="text-slate-500">No tienes permisos para ver esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Administra los accesos, roles y contraseñas del equipo.</p>
        </div>
        <Button onClick={openNewUserModal}>
          + Nuevo Usuario
        </Button>
      </div>

      {/* --- BARRA DE BÚSQUEDA Y FILTROS --- */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Buscador */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o correo..."
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-exodus-500/20 shadow-sm transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Botones de Filtro (Tabs) */}
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
          {['TODOS', 'CAE', 'TI'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterDept(tab as any)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                filterDept === tab
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'TODOS' ? 'Todos' : tab === 'CAE' ? 'Solo CAE' : 'Solo TI'}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA */}
      <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre y Correo</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario (Login)</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accesos</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Cargando usuarios...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No se encontraron usuarios con esos filtros.</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/60 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email || 'Sin correo'}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {u.departments?.map((dep: string) => (
                          <span key={dep} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${dep === 'CAE' ? 'bg-exodus-50 text-exodus-600 border-exodus-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                            {dep}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditUserModal(u)} className="p-2 text-slate-400 hover:text-exodus-600 transition-colors" title="Editar usuario">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => confirmDelete(u)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar usuario">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear/Editar Usuario */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <AdminUserForm 
          initialData={editingUser}
          onSuccess={() => {
            closeModal()
            fetchUsuarios() 
          }}
          onCancel={closeModal}
        />
      </Modal>

      {/* Modal con Contraseña para Eliminar */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title={`Eliminar usuario: ${userToDelete?.name}`}
      >
        <form onSubmit={executeDelete} className="text-center space-y-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">¿Estás seguro?</h3>
            <p className="text-sm text-slate-500 mt-2 px-4">
              Ingresa la contraseña maestra para eliminar este usuario del sistema de forma permanente.
            </p>
          </div>

          <div className="max-w-xs mx-auto">
            <input
              type="password"
              placeholder="••••••••"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-4 py-3 text-center tracking-[0.3em] rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
              autoFocus
            />
            {deleteError && (
              <p className="text-red-500 text-xs mt-2 font-medium animate-in fade-in slide-in-from-top-1">
                {deleteError}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={isDeleting || !deletePassword}
              className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 disabled:opacity-50"
            >
              {isDeleting ? 'Borrando...' : 'Sí, borrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}