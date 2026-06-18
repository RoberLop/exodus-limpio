'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AdminUserForm } from '@/components/forms/AdminUserForm'
import { AdminAnnounceForm } from '@/components/forms/AdminAnnounceForm'

export default function AdminPage() {
  const { isAdmin } = useAuth()
  
  // Pestañas (Tabs)
  const [activeTab, setActiveTab] = useState<'usuarios' | 'anuncios'>('usuarios')

  // Estados de Usuarios
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState<'TODOS' | 'CAE' | 'TI'>('TODOS')
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Estados de Anuncios
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [isLoadingAnuncios, setIsLoadingAnuncios] = useState(true)
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false)
  const [editingAnuncio, setEditingAnuncio] = useState<any | null>(null)
  const [isDeleteAnuncioModalOpen, setIsDeleteAnuncioModalOpen] = useState(false)
  const [anuncioToDelete, setAnuncioToDelete] = useState<any | null>(null)

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios()
      fetchAnuncios()
    }
  }, [isAdmin])

  // --- LÓGICA DE USUARIOS ---
  const fetchUsuarios = async () => {
    setIsLoadingUsers(true)
    const { data } = await supabase.from('usuarios').select('*').order('id', { ascending: true })
    if (data) setUsuarios(data)
    setIsLoadingUsers(false)
  }

  const executeDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deletePassword !== 'isAdmin02') { setDeleteError('Contraseña incorrecta.'); return; }
    const { error } = await supabase.from('usuarios').delete().eq('id', userToDelete.id)
    if (!error) { setIsDeleteUserModalOpen(false); fetchUsuarios(); }
  }

  // --- LÓGICA DE ANUNCIOS ---
  const fetchAnuncios = async () => {
    setIsLoadingAnuncios(true)
    const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false })
    if (data) setAnuncios(data)
    setIsLoadingAnuncios(false)
  }

  const executeDeleteAnuncio = async () => {
    const { error } = await supabase.from('anuncios').delete().eq('id', anuncioToDelete.id)
    if (!error) { setIsDeleteAnuncioModalOpen(false); fetchAnuncios(); }
  }

  const openNewAnuncioModal = () => { setEditingAnuncio(null); setIsAnnounceModalOpen(true); }
  const openEditAnuncioModal = (anuncio: any) => { setEditingAnuncio(anuncio); setIsAnnounceModalOpen(true); }

  const filteredUsers = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase()
    const matchSearch = (u.name?.toLowerCase().includes(term)) || (u.username?.toLowerCase().includes(term))
    const matchDept = filterDept === 'TODOS' ? true : u.departments?.includes(filterDept)
    return matchSearch && matchDept
  })

  if (!isAdmin) return null // Redirección o UI de denegado

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER DINÁMICO */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === 'usuarios' ? 'Gestión de Usuarios' : 'Tablero de Anuncios'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === 'usuarios' 
              ? 'Administra los accesos, roles y contraseñas del equipo.' 
              : 'Crea, edita o elimina los avisos que ve el personal.'}
          </p>
        </div>
        
        {activeTab === 'usuarios' ? (
          <Button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>+ Nuevo Usuario</Button>
        ) : (
          <Button onClick={openNewAnuncioModal}> Nuevo Anuncio</Button>
        )}
      </div>

      {/* PESTAÑAS (TABS) */}
      <div className="flex gap-6 border-b border-slate-200/60 pb-px">
        <button 
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'usuarios' ? 'border-exodus-500 text-exodus-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          👤 Equipo y Accesos
        </button>
        <button 
          onClick={() => setActiveTab('anuncios')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'anuncios' ? 'border-exodus-500 text-exodus-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          📢 Comunicados
        </button>
      </div>

      {/* VISTA DE USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input type="text" placeholder="Buscar usuario..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-exodus-500/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
              {['TODOS', 'CAE', 'TI'].map((tab) => (
                <button key={tab} onClick={() => setFilterDept(tab as any)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${filterDept === tab ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{tab}</button>
              ))}
            </div>
          </div>
          
          <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-xl shadow-slate-200/40">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs text-slate-500 uppercase">
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Rol / Accesos</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40">
                {isLoadingUsers ? <tr><td colSpan={4} className="p-8 text-center text-slate-400">Cargando...</td></tr> : filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/60">
                    <td className="p-4"><div className="font-medium">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></td>
                    <td className="p-4 text-sm font-medium">{u.username}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 border">{u.role}</span>
                        {u.departments?.map((d: string) => <span key={d} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-exodus-50 text-exodus-600 border">{d}</span>)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="p-2 text-slate-400 hover:text-exodus-600">✏️</button>
                      <button onClick={() => { setUserToDelete(u); setDeletePassword(''); setDeleteError(''); setIsDeleteUserModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-500">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA DE ANUNCIOS */}
      {activeTab === 'anuncios' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-xl shadow-slate-200/40">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs text-slate-500 uppercase">
                  <th className="p-4">Anuncio</th>
                  <th className="p-4">Dirigido a</th>
                  <th className="p-4">Importancia</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40">
                {isLoadingAnuncios ? <tr><td colSpan={4} className="p-8 text-center text-slate-400">Cargando...</td></tr> : anuncios.map((a) => (
                  <tr key={a.id} className="hover:bg-white/60">
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{a.titulo}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{a.mensaje}</div>
                    </td>
                    <td className="p-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 border">{a.departamento}</span></td>
                    <td className="p-4">{a.importancia === 'Alta' ? <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg">🔥 Alta</span> : <span className="text-slate-500 text-xs">Normal</span>}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditAnuncioModal(a)} className="p-2 text-slate-400 hover:text-exodus-600">✏️</button>
                      <button onClick={() => { setAnuncioToDelete(a); setIsDeleteAnuncioModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-500">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ZONA DE MODALES --- */}
      
      {/* Modal Usuarios */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}>
        <AdminUserForm initialData={editingUser} onSuccess={() => { setIsUserModalOpen(false); fetchUsuarios(); }} onCancel={() => setIsUserModalOpen(false)} />
      </Modal>

      {/* Modal Anuncios */}
      <Modal isOpen={isAnnounceModalOpen} onClose={() => setIsAnnounceModalOpen(false)} title={editingAnuncio ? "Editar Anuncio" : "Nuevo Anuncio"}>
        <AdminAnnounceForm initialData={editingAnuncio} onSuccess={() => { setIsAnnounceModalOpen(false); fetchAnuncios(); }} onCancel={() => setIsAnnounceModalOpen(false)} />
      </Modal>

      {/* Modal Eliminar Usuario (CON Contraseña) */}
      <Modal isOpen={isDeleteUserModalOpen} onClose={() => setIsDeleteUserModalOpen(false)} title={`Eliminar a ${userToDelete?.name}`}>
        <form onSubmit={executeDeleteUser} className="text-center py-4">
          <input type="password" placeholder="Contraseña maestra" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="w-full px-4 py-3 text-center tracking-widest rounded-xl border mb-4" autoFocus />
          {deleteError && <p className="text-red-500 text-xs mb-4">{deleteError}</p>}
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Sí, eliminar usuario</Button>
        </form>
      </Modal>

      {/* Modal Eliminar Anuncio (SIN Contraseña, más rápido) */}
      <Modal isOpen={isDeleteAnuncioModalOpen} onClose={() => setIsDeleteAnuncioModalOpen(false)} title="Eliminar Anuncio">
        <div className="text-center py-4 space-y-4">
          <p className="text-sm text-slate-500">¿Estás seguro de que deseas eliminar este anuncio? Desaparecerá del tablero de todos inmediatamente.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteAnuncioModalOpen(false)}>Cancelar</Button>
            <button onClick={executeDeleteAnuncio} className="flex-1 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Sí, borrar</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}