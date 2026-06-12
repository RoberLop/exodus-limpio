'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, areaLabels, areaIcons } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { OperationalArea } from '@/lib/types'

const areas: OperationalArea[] = ['exodus', 'almacen', 'credito', 'pinpad', 'embarques', 'movil']

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 p-4">
      <div className="h-full glass rounded-3xl flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-exodus-500 to-exodus-700 flex items-center justify-center shadow-lg shadow-exodus-500/30">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Exodus</h1>
              <p className="text-xs text-slate-500">Exodus-Cae</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Áreas Operativas
          </p>
          
          {areas.map((area) => {
            const isActive = pathname.includes(`/dashboard/${area}`)
            
            return (
              <Link
                key={area}
                href={`/dashboard/${area}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  'text-sm font-medium',
                  isActive
                    ? 'bg-white shadow-md text-exodus-600'
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                )}
              >
                <span className="text-lg">{areaIcons[area]}</span>
                <span>{areaLabels[area]}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-exodus-500" />
                )}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="pt-4">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Administración
                </p>
              </div>
              <Link
                href="/dashboard/admin"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  'text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-slate-900'
                )}
              >
                <span className="text-lg">⚙️</span>
                <span>Panel Admin</span>
              </Link>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <span className="text-sm font-semibold text-slate-600">
                {user?.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {isAdmin ? 'Administrador' : 'Usuario'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}