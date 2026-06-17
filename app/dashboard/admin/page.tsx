'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

export default function AdminPage() {
  const { isAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios()
    }
  }, [isAdmin])

  const fetchUsuarios = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('id', { ascending: true })
    
    if (error) {
      console.error('Error al cargar usuarios:', error)
    } else if (data) {
      setUsuarios(data)
    }
    setIsLoading(false)
  }

  // Si alguien que no es admin intenta entrar copiando la URL, le bloqueamos el paso
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
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
          <p className="mt-1 text-sm text-slate-500">
            Administra los accesos, roles y contraseñas del equipo.
          </p>
        </div>
        <Button onClick={() => alert('¡Próximo paso: Modal de Nuevo Usuario!')}>
          + Nuevo Usuario
        </Button>
      </div>

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
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-white/60 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email || 'Sin correo'}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {u.username}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        u.role === 'admin' 
                          ? 'bg-purple-50 text-purple-600 border-purple-200' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {u.departments?.map((dep: string) => (
                          <span key={dep} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            dep === 'CAE' ? 'bg-exodus-50 text-exodus-600 border-exodus-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          }`}>
                            {dep}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-exodus-600 transition-colors" title="Editar usuario">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar usuario">
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
    </div>
  )
}