'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const { user, isSuperAdmin, logout } = useAuth()

  // Menú simplificado: Solo vistas globales de alto impacto
  const navItems = [
    {
      label: 'Soluciones Globales',
      href: `/dashboard/${user?.department?.toLowerCase() || 'cae'}/global`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    },
    {
      label: 'Tablero de Anuncios',
      href: `/dashboard/${user?.department?.toLowerCase() || 'cae'}/anuncios`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.888pt-3.237 2.122A1.25 1.25 0 006 9v6a1.25 1.25 0 001.763 1.138L11 14.112V5.888zM18.5 8.75a4.25 4.25 0 010 6.5M16 10.5a1.75 1.75 0 010 3" />
        </svg>
      )
    },
    {
      label: 'Gobernanza / Solicitudes',
      href: `/dashboard/${user?.department?.toLowerCase() || 'cae'}/autorizaciones`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 text-white z-40 flex flex-col p-6">
      
      {/* Header del Sidebar */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-sky-500/20">
          EX
        </div>
        <div>
          <h1 className="font-black tracking-wider text-base">EXODUS</h1>
          <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
            {user?.department || 'Soporte CAE'}
          </p>
        </div>
      </div>

      {/* Navegación Principal Simplificada */}
      <nav className="flex-1 mt-6 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
          Centro de Mando
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200",
                isActive 
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-lg shadow-sky-500/10" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Perfil del Usuario y Logout */}
      <div className="pt-6 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Usuario'}</p>
            <p className="text-[10px] text-slate-500 truncate">{isSuperAdmin ? 'Super Admin' : 'Operador'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}