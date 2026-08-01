'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn, areaLabels, areaIcons } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { OperationalArea } from '@/lib/types'
import { GlobalRequestWidget } from '@/components/ui/GlobalRequestWidget'
import { MajorIncidentBanner } from '@/components/ui/MajorIncidentBanner'
import { GlobalAnnounceBanner } from '@/components/ui/GlobalAnnounceBanner'

const mainAreasCAE: OperationalArea[] = ['almacen', 'credito', 'pinpad', 'embarques', 'movil']
const exodusSubAreasCAE: ['exodus_mostradores', 'exodus_sucursales', 'exodus_sucursales_sic', 'exodus_erp_profesional', 'exodus_profesional_2013', 'exodus_embarques', 'exodus_epico'] = ['exodus_mostradores', 'exodus_sucursales', 'exodus_sucursales_sic', 'exodus_erp_profesional', 'exodus_profesional_2013', 'exodus_embarques', 'exodus_epico']
const areasTI: OperationalArea[] = ['categoria_1', 'categoria_2', 'categoria_3', 'categoria_4', 'categoria_5', 'categoria_6']

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAdmin, isLoading } = useAuth()
  const [isExodusOpen, setIsExodusOpen] = useState(false)

  const isTI = user?.department === 'TI'

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [user, isLoading, router])

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-72 p-4 z-40">
        <div className="h-full glass rounded-3xl flex flex-col overflow-hidden relative border border-slate-200/50 shadow-sm">
          
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg", isTI ? "bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/30" : "bg-gradient-to-br from-exodus-500 to-exodus-700 shadow-exodus-500/30")}>
                <span className="text-white font-bold text-lg">{isTI ? 'TI' : 'E'}</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Exodus</h1>
                <p className="text-xs text-slate-500">{isTI ? 'Operaciones TI' : 'Soporte CAE'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            
            <Link href="/dashboard/global" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-4', pathname.includes('/dashboard/global') ? 'bg-slate-800 shadow-md text-white' : 'bg-white shadow-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900')}>
              <span className="text-lg">{areaIcons['global']}</span>
              <span className="font-bold">{areaLabels['global']}</span>
            </Link>

            <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Áreas Operativas</p>
            
            {!isTI && (
              <>
                <div>
                  <button onClick={() => setIsExodusOpen(!isExodusOpen)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-slate-900">
                    <div className="flex items-center gap-3"><span className="text-lg">{isExodusOpen ? '📂' : '📁'}</span><span>Exodus</span></div>
                    <svg className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isExodusOpen ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isExodusOpen && (
                    <div className="mt-1 mb-2 space-y-1 pl-4 border-l-2 border-slate-200/50 ml-5">
                      {exodusSubAreasCAE.map((area) => {
                        const isActive = pathname.includes(`/dashboard/${area}`)
                        return (
                          <Link key={area} href={`/dashboard/${area}`} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium', isActive ? 'bg-white shadow-sm text-exodus-600' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800')}>
                            <span className="truncate">{areaLabels[area]}</span>
                            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-exodus-500 flex-shrink-0" />}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {mainAreasCAE.map((area) => {
                  const isActive = pathname.includes(`/dashboard/${area}`)
                  return (
                    <Link key={area} href={`/dashboard/${area}`} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium', isActive ? 'bg-white shadow-md text-exodus-600' : 'text-slate-600 hover:bg-white/50 hover:text-slate-900')}>
                      <span className="text-lg">{areaIcons[area]}</span><span>{areaLabels[area]}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-exodus-500" />}
                    </Link>
                  )
                })}
              </>
            )}

            {isTI && areasTI.map((area) => {
              const isActive = pathname.includes(`/dashboard/${area}`)
              return (
                <Link key={area} href={`/dashboard/${area}`} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium', isActive ? 'bg-white shadow-md text-indigo-600' : 'text-slate-600 hover:bg-white/50 hover:text-slate-900')}>
                  <span className="text-lg">{areaIcons[area]}</span><span>{areaLabels[area]}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </Link>
              )
            })}

            <div className="pt-4 mt-4 border-t border-slate-200/50 space-y-2">
              <Link href="/dashboard/informacion" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200', pathname.includes('/dashboard/informacion') ? 'bg-cyan-50 border border-cyan-100 text-cyan-700 font-bold' : 'text-sm font-medium text-slate-600 hover:bg-cyan-50/50 hover:text-cyan-700')}>
                <span className="text-lg"> </span><span>Centro de Información</span>
              </Link>

              <Link href="/dashboard/caidas" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200', pathname.includes('/dashboard/caidas') ? 'bg-red-50 border border-red-100 text-red-700 font-bold' : 'text-sm font-medium text-slate-600 hover:bg-red-50/50 hover:text-red-700')}>
                <span className="text-lg"> </span><span>Historial de Caídas</span>
              </Link>
            </div>

            {isAdmin && (
              <>
                <div className="pt-4"><p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Administración</p></div>
                <Link href="/dashboard/admin" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200', pathname.includes('/dashboard/admin') ? 'bg-white shadow-md text-exodus-600' : 'text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-slate-900')}><span className="text-lg">⚙️</span><span>Panel Admin</span></Link>
                <Link href="/dashboard/logs" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200', pathname.includes('/dashboard/logs') ? 'bg-white shadow-md text-exodus-600' : 'text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-slate-900')}><span className="text-lg">📖</span><span>Historial Logs</span></Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-slate-200/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center"><span className="text-sm font-semibold text-slate-600">{user?.name ? user.name.charAt(0).toUpperCase() : ''}</span></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p><p className="text-xs text-slate-500 truncate">{isAdmin ? 'Administrador' : 'Usuario'} • {isTI ? 'TI' : 'CAE'}</p></div>
              <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors" title="Cerrar sesión"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
            </div>
          </div>
        </div>
      </aside>

      <GlobalRequestWidget />
      <MajorIncidentBanner />
      <GlobalAnnounceBanner />
    </>
  )
}