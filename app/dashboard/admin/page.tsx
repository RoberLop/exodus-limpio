'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AdminUserForm } from '@/components/forms/AdminUserForm'
import { AdminAnnounceForm } from '@/components/forms/AdminAnnounceForm'

export default function AdminPage() {
  const { isAdmin, isSuperAdmin, user } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'usuarios' | 'anuncios' | 'autorizaciones'>('usuarios')

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

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
  const [deleteObservation, setDeleteObservation] = useState('')

  // Estados de Solicitar Contraseña
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [userForPassword, setUserForPassword] = useState<any | null>(null)
  const [passwordObservation, setPasswordObservation] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Estados de Anuncios
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [isLoadingAnuncios, setIsLoadingAnuncios] = useState(true)
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false)
  const [editingAnuncio, setEditingAnuncio] = useState<any | null>(null)
  const [isDeleteAnuncioModalOpen, setIsDeleteAnuncioModalOpen] = useState(false)
  const [anuncioToDelete, setAnuncioToDelete] = useState<any | null>(null)

  // Estados de Autorizaciones
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [isLoadingSolicitudes, setIsLoadingSolicitudes] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>('PENDIENTE')
  const [authDeptFilter, setAuthDeptFilter] = useState<'TODOS' | 'CAE' | 'TI'>('TODOS')

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios()
      fetchAnuncios()
      fetchSolicitudes()

      const canalSolicitudes = supabase
        .channel('cambios-en-solicitudes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'solicitudes_cambio' },
          () => fetchSolicitudes()
        )
        .subscribe()

      return () => { supabase.removeChannel(canalSolicitudes) }
    }
  }, [isAdmin, isSuperAdmin, user])

  const fetchUsuarios = async () => {
    setIsLoadingUsers(true)
    const { data } = await supabase.from('usuarios').select('*').order('id', { ascending: true })
    if (data) setUsuarios(data)
    setIsLoadingUsers(false)
  }

  const executeDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSuperAdmin) {
      if (deletePassword !== 'isAdmin02') { setDeleteError('Contraseña de seguridad incorrecta.'); return; }
      const { error } = await supabase.from('usuarios').delete().eq('id', userToDelete.id)
      if (!error) { 
        setIsDeleteUserModalOpen(false)
        fetchUsuarios()
        showToast('Usuario eliminado de forma permanente.')
      }
    } else {
      if (!deleteObservation) { setDeleteError('La justificación es obligatoria.'); return; }
      const { error } = await supabase.from('solicitudes_cambio').insert([{
        solicitante: user?.name || 'Administrador',
        departamento: user?.department || 'TODOS',
        tipo_solicitud: 'ELIMINAR_USUARIO',
        tabla_destino: 'usuarios',
        registro_id: userToDelete.id.toString(),
        observacion: deleteObservation,
        informacion_cambio: userToDelete
      }])
      
      if (!error) {
        showToast('Solicitud de eliminación enviada a Gobernanza de TI.')
        setIsDeleteUserModalOpen(false)
        setDeleteObservation('')
      } else {
        showToast('Error al generar la solicitud.', 'error')
      }
    }
  }

  const executeRequestPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordObservation) { setPasswordError('Debes justificar por qué necesitas ver la credencial.'); return; }
    
    const { error } = await supabase.from('solicitudes_cambio').insert([{
      solicitante: user?.name || 'Administrador',
      departamento: user?.department || 'TODOS',
      tipo_solicitud: 'VER_PASSWORD',
      tabla_destino: 'usuarios',
      registro_id: userForPassword.id.toString(),
      observacion: passwordObservation,
      informacion_cambio: { password: userForPassword.password, name: userForPassword.name }
    }])
    
    if (!error) {
      showToast('Solicitud enviada. Podrás verla en tu bandeja cuando sea aprobada.')
      setIsPasswordModalOpen(false)
      setPasswordObservation('')
    } else {
      showToast('Error al enviar solicitud.', 'error')
    }
  }

  const fetchAnuncios = async () => {
    setIsLoadingAnuncios(true)
    const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false })
    if (data) setAnuncios(data)
    setIsLoadingAnuncios(false)
  }

  const executeDeleteAnuncio = async () => {
    const { error } = await supabase.from('anuncios').delete().eq('id', anuncioToDelete.id)
    if (!error) { 
      setIsDeleteAnuncioModalOpen(false)
      fetchAnuncios()
      showToast('Comunicado retirado exitosamente.')
    }
  }

  const openNewAnuncioModal = () => { setEditingAnuncio(null); setIsAnnounceModalOpen(true); }
  const openEditAnuncioModal = (anuncio: any) => { setEditingAnuncio(anuncio); setIsAnnounceModalOpen(true); }

  const fetchSolicitudes = async () => {
    setIsLoadingSolicitudes(true)
    let query = supabase.from('solicitudes_cambio').select('*').order('creado_at', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('solicitante', user?.name)
    }

    const { data } = await query
    if (data) setSolicitudes(data)
    setIsLoadingSolicitudes(false)
  }

  const handleAprobarSolicitud = async (solicitud: any) => {
    try {
      let queryError = null

      if (solicitud.tipo_solicitud === 'ELIMINAR_TICKET') {
        const { error } = await supabase.from('errors').delete().eq('id', solicitud.registro_id)
        queryError = error
      } else if (solicitud.tipo_solicitud === 'EDITAR_TICKET') {
        const { error } = await supabase.from('errors').update(solicitud.informacion_cambio).eq('id', solicitud.registro_id)
        queryError = error
      } else if (solicitud.tipo_solicitud === 'ELIMINAR_USUARIO') {
        const { error } = await supabase.from('usuarios').delete().eq('id', parseInt(solicitud.registro_id))
        queryError = error
      } else if (solicitud.tipo_solicitud === 'CREAR_USUARIO') {
        const { error } = await supabase.from('usuarios').insert([solicitud.informacion_cambio])
        queryError = error
      } else if (solicitud.tipo_solicitud === 'EDITAR_USUARIO') {
        const { error } = await supabase.from('usuarios').update(solicitud.informacion_cambio).eq('id', parseInt(solicitud.registro_id))
        queryError = error
      }

      if (queryError) {
        showToast('Error operativo en base de datos: ' + queryError.message, 'error')
        return
      }

      await supabase
        .from('solicitudes_cambio')
        .update({ estado: 'APROBADO', procesado_por: user?.name || 'Administrador', procesado_at: new Date().toISOString() })
        .eq('id', solicitud.id)

      showToast('Solicitud aprobada y ejecutada con éxito.')
      fetchSolicitudes()
      fetchUsuarios()
    } catch (err) {
      console.error('Error de procesamiento:', err)
    }
  }

  // --- LÓGICA DE RECHAZO CON MOTIVO ---
  const handleRechazarSolicitud = async (solicitud: any) => {
    const motivo = window.prompt('¿Cuál es el motivo del rechazo? (El administrador lo verá en su bandeja)')
    if (motivo === null) return // Si le da a cancelar

    const firmaRechazo = `${user?.name || 'Administrador'}${motivo ? ` - Motivo: ${motivo}` : ''}`

    await supabase
      .from('solicitudes_cambio')
      .update({ estado: 'RECHAZADO', procesado_por: firmaRechazo, procesado_at: new Date().toISOString() })
      .eq('id', solicitud.id)
    
    showToast('Solicitud rechazada.', 'error')
    fetchSolicitudes()
  }

  const filteredUsers = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase()
    const matchSearch = (u.name?.toLowerCase().includes(term)) || (u.username?.toLowerCase().includes(term))
    const matchDept = filterDept === 'TODOS' ? true : u.departments?.includes(filterDept)
    return matchSearch && matchDept
  })

  const filteredSolicitudes = solicitudes.filter((s) => {
    const matchStatus = s.estado === filterStatus
    const matchDept = authDeptFilter === 'TODOS' ? true : s.departamento === authDeptFilter || s.departamento === 'TODOS'
    return matchStatus && matchDept
  })

  // --- CÁLCULO DE INSIGNIAS (NOTIFICACIONES EN LAS PESTAÑAS) ---
  const pendingAuthCount = isSuperAdmin 
    ? solicitudes.filter(s => s.estado === 'PENDIENTE').length 
    : solicitudes.filter(s => s.estado !== 'PENDIENTE' && s.solicitante === user?.name).length

  const formatFecha = (isoString: string) => {
    if (!isoString) return ''
    const fecha = new Date(isoString)
    return fecha.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-[100] border transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <div className="flex items-center gap-3 font-bold text-sm">
            <span>{toast.type === 'success' ? '✓' : '✖'}</span>
            {toast.message}
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === 'usuarios' ? 'Gestión de Usuarios' : activeTab === 'anuncios' ? 'Tablero de Comunicados' : 'Bandeja de Autorizaciones'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === 'usuarios' 
              ? 'Administración de perfiles y permisos de sistema.' 
              : activeTab === 'anuncios'
              ? 'Gestión de comunicados y alertas operativas.'
              : isSuperAdmin ? 'Gobernanza central: revisión de solicitudes críticas del sistema.' : 'Historial de tus solicitudes enviadas a Gobernanza.'}
          </p>
        </div>
        
        {activeTab === 'usuarios' && (
          <Button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>Nuevo Usuario</Button>
        )}
        {activeTab === 'anuncios' && (
          <Button onClick={openNewAnuncioModal}>Nuevo Anuncio</Button>
        )}
      </div>

      <div className="flex gap-6 border-b border-slate-200/60 pb-px">
        <button onClick={() => setActiveTab('usuarios')} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'usuarios' ? 'border-exodus-500 text-exodus-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Equipo y Accesos
        </button>
        <button onClick={() => setActiveTab('anuncios')} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'anuncios' ? 'border-exodus-500 text-exodus-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Comunicados
        </button>
        
        {/* PESTAÑA CON INSIGNIA DE NOTIFICACIÓN */}
        <button onClick={() => setActiveTab('autorizaciones')} className={`relative pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'autorizaciones' ? 'border-exodus-500 text-exodus-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Autorizaciones
          {pendingAuthCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${isSuperAdmin ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
              {pendingAuthCount}
            </span>
          )}
        </button>
      </div>

      {/* VISTA USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input type="text" placeholder="Buscar usuario..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-exodus-500/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
              {['TODOS', 'CAE', 'TI'].map((tab) => (
                <button key={tab} onClick={() => setFilterDept(tab as any)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${filterDept === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{tab}</button>
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
                  <th className="p-4 text-right">Controles</th>
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
                      <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-exodus-600 border border-transparent hover:border-slate-200 rounded-lg transition-all mr-2">Editar</button>
                      <button onClick={() => { setUserToDelete(u); setDeletePassword(''); setDeleteObservation(''); setDeleteError(''); setIsDeleteUserModalOpen(true); }} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg transition-all">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA ANUNCIOS */}
      {activeTab === 'anuncios' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-xl shadow-slate-200/40">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs text-slate-500 uppercase">
                  <th className="p-4">Comunicado</th>
                  <th className="p-4">Destino</th>
                  <th className="p-4">Nivel</th>
                  <th className="p-4 text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40">
                {isLoadingAnuncios ? <tr><td colSpan={4} className="p-8 text-center text-slate-400">Cargando...</td></tr> : anuncios.map((a) => (
                  <tr key={a.id} className="hover:bg-white/60">
                    <td className="p-4 max-w-xs"><div className="font-bold text-slate-900 truncate">{a.titulo}</div><div className="text-xs text-slate-500 truncate mt-0.5">{a.mensaje}</div></td>
                    <td className="p-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 border">{a.departamento}</span></td>
                    <td className="p-4">{a.importancia === 'Alta' ? <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg">Alta Prioridad</span> : <span className="text-slate-500 text-xs font-medium">Estándar</span>}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditAnuncioModal(a)} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-exodus-600 border border-transparent hover:border-slate-200 rounded-lg transition-all mr-2">Editar</button>
                      <button onClick={() => { setAnuncioToDelete(a); setIsDeleteAnuncioModalOpen(true); }} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg transition-all">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA AUTORIZACIONES */}
      {activeTab === 'autorizaciones' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
              {['PENDIENTE', 'APROBADO', 'RECHAZADO'].map((status) => (
                <button key={status} onClick={() => setFilterStatus(status as any)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                  {status === 'PENDIENTE' ? 'Pendientes' : status === 'APROBADO' ? 'Aprobados' : 'Rechazados'}
                </button>
              ))}
            </div>
            
            {isSuperAdmin && (
              <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
                {['TODOS', 'CAE', 'TI'].map((tab) => (
                  <button key={tab} onClick={() => setAuthDeptFilter(tab as any)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${authDeptFilter === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{tab}</button>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-xl shadow-slate-200/40">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs text-slate-500 uppercase">
                  <th className="p-4">Solicitante</th>
                  <th className="p-4">Operación</th>
                  <th className="p-4">Justificación</th>
                  <th className="p-4 text-right">Gobernanza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40">
                {isLoadingSolicitudes ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Cargando datos...</td></tr>
                ) : filteredSolicitudes.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Bandeja limpia. No hay registros.</td></tr>
                ) : (
                  filteredSolicitudes.map((s) => (
                    <tr key={s.id} className="hover:bg-white/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{s.solicitante}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatFecha(s.creado_at)}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${s.tipo_solicitud.includes('ELIMINAR') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {s.tipo_solicitud.replace('_', ' ')}
                        </span>
                        {s.departamento !== 'TODOS' && <span className="ml-2 text-[10px] text-slate-500 font-bold border border-slate-200 px-1.5 rounded">{s.departamento}</span>}
                        {s.tipo_solicitud === 'VER_PASSWORD' && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                             PRIORIDAD ALTA
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-medium max-w-xs">
                        <div className="truncate">{s.observacion || 'Sin justificación provista'}</div>
                        
                        {/* VISUALIZACIÓN DE CONTRASEÑA */}
                        {!isSuperAdmin && s.estado === 'APROBADO' && s.tipo_solicitud === 'VER_PASSWORD' && (
                          <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                            <span className="font-bold text-emerald-800">Credencial de {s.informacion_cambio?.name}: </span>
                            <code className="bg-white px-2 py-1 rounded border text-emerald-700 font-mono font-bold tracking-widest">{s.informacion_cambio?.password}</code>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {s.estado === 'PENDIENTE' ? (
                          isSuperAdmin ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleAprobarSolicitud(s)} className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg hover:bg-slate-900 transition-colors shadow-sm">Aprobar</button>
                              <button onClick={() => handleRechazarSolicitud(s)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors">Rechazar</button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">En revisión</span>
                          )
                        ) : (
                          <div className="text-xs font-semibold text-slate-500">
                            {s.estado === 'APROBADO' ? '✅ Aprobado por ' : '❌ '}
                            <span className="text-slate-800">{s.procesado_por}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALES --- */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? "Editar Perfil" : "Nuevo Perfil"}>
        <AdminUserForm 
          initialData={editingUser} 
          onSuccess={(msg) => { setIsUserModalOpen(false); fetchUsuarios(); showToast(msg); }} 
          onCancel={() => setIsUserModalOpen(false)} 
          onRequestPassword={(userData) => {
            setIsUserModalOpen(false)
            setUserForPassword(userData)
            setPasswordObservation('')
            setPasswordError('')
            setIsPasswordModalOpen(true)
          }}
        />
      </Modal>

      <Modal isOpen={isAnnounceModalOpen} onClose={() => setIsAnnounceModalOpen(false)} title={editingAnuncio ? "Editar Comunicado" : "Nuevo Comunicado"}>
        <AdminAnnounceForm initialData={editingAnuncio} onSuccess={() => { setIsAnnounceModalOpen(false); fetchAnuncios(); showToast('Anuncio publicado correctamente.'); }} onCancel={() => setIsAnnounceModalOpen(false)} />
      </Modal>

      <Modal isOpen={isDeleteUserModalOpen} onClose={() => setIsDeleteUserModalOpen(false)} title={`Eliminar cuenta: ${userToDelete?.name}`}>
        <form onSubmit={executeDeleteUser} className="text-left py-4 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 mb-4">
            Estás a punto de solicitar la eliminación del sistema para este usuario. Esta acción es irreversible tras su aprobación.
          </div>
          
          {isSuperAdmin ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña de Seguridad</label>
              <input type="password" placeholder="Requerida para acción directa" value={deletePassword} onChange={(e) => {setDeletePassword(e.target.value); setDeleteError('');}} className="w-full px-4 py-3 tracking-widest rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-500/20 outline-none" autoFocus />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Justificación del cambio</label>
              <textarea placeholder="Ej: El usuario ya no labora en la empresa..." value={deleteObservation} onChange={(e) => {setDeleteObservation(e.target.value); setDeleteError('');}} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-500/20 outline-none" rows={3} autoFocus />
            </div>
          )}

          {deleteError && <p className="text-red-500 text-xs font-semibold text-center">{deleteError}</p>}
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsDeleteUserModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-slate-800 hover:bg-slate-900 text-white">{isSuperAdmin ? 'Eliminar Definitivo' : 'Enviar Solicitud'}</Button>
          </div>
        </form>
      </Modal>

      {/* NUEVO MODAL: Pedir ver contraseña (Viene del Ojito) */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Solicitar Ver Credenciales">
        <form onSubmit={executeRequestPassword} className="text-left py-4 space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-700 mb-4">
            Solicitarás acceso de lectura para la contraseña de <strong>{userForPassword?.name}</strong>. Esto requiere aprobación de Gobernanza.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Justificación obligatoria</label>
            <textarea placeholder="Ej: El usuario bloqueó su cuenta y requiere la clave temporal..." value={passwordObservation} onChange={(e) => {setPasswordObservation(e.target.value); setPasswordError('');}} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-500/20 outline-none" rows={3} autoFocus />
          </div>
          {passwordError && <p className="text-red-500 text-xs font-semibold text-center">{passwordError}</p>}
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Enviar Solicitud</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteAnuncioModalOpen} onClose={() => setIsDeleteAnuncioModalOpen(false)} title="Retirar Comunicado">
        <div className="text-center py-4 space-y-4">
          <p className="text-sm text-slate-500">¿Confirmas retirar este comunicado? Desaparecerá de las pantallas del personal de forma inmediata.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteAnuncioModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-slate-800 hover:bg-slate-900 text-white" onClick={executeDeleteAnuncio}>Confirmar</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}