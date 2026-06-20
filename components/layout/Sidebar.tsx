'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn, areaLabels, areaIcons } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { OperationalArea } from '@/lib/types'
import { GlobalRequestWidget } from '@/components/ui/GlobalRequestWidget'
import { MajorIncidentBanner } from '@/components/ui/MajorIncidentBanner'
import { GlobalAnnounceBanner } from '@/components/ui/GlobalAnnounceBanner' // <-- NUEVA IMPORTACIÓN
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

// Constantes de Mapeo
const mainAreasCAE: OperationalArea[] = ['almacen', 'credito', 'pinpad', 'embarques', 'movil']
const exodusSubAreasCAE: ['exodus_mostradores', 'exodus_sucursales', 'exodus_sucursales_sic', 'exodus_erp_profesional', 'exodus_profesional_2013', 'exodus_embarques', 'exodus_epico'] = ['exodus_mostradores', 'exodus_sucursales', 'exodus_sucursales_sic', 'exodus_erp_profesional', 'exodus_profesional_2013', 'exodus_embarques', 'exodus_epico']
const areasTI: OperationalArea[] = ['categoria_1', 'categoria_2', 'categoria_3', 'categoria_4', 'categoria_5', 'categoria_6']

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAdmin, isLoading } = useAuth()
  const [isExodusOpen, setIsExodusOpen] = useState(false)

  // Estados de declaración de falla masiva
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportDept, setReportDept] = useState('TODOS')
  const [isReporting, setIsReporting] = useState(false)
  
  // Referencias para captura de evidencia
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  const isTI = user?.department === 'TI'

  // Verificación de sesión
  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [user, isLoading, router])

  // Conversión de evidencia a Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setScreenshotPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Ejecución de declaración de incidente
  const handleReportDowntime = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsReporting(true)

    const { error } = await supabase.from('caidas_masivas').insert([{
      titulo: reportTitle,
      descripcion: reportDescription,
      departamento: reportDept,
      creado_por: user?.name || 'Administrador',
      screenshot_url: screenshotPreview
    }])

    if (error) {
      alert('Error operativo al declarar incidente: ' + error.message)
    } else {
      setIsReportModalOpen(false)
      setReportTitle('')
      setReportDescription('')
      setScreenshotPreview(null)
    }
    setIsReporting(false)
  }

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
                <span className="text-lg">📢</span><span>Centro de Información</span>
              </Link>

              <Link href="/dashboard/caidas" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200', pathname.includes('/dashboard/caidas') ? 'bg-red-50 border border-red-100 text-red-700 font-bold' : 'text-sm font-medium text-slate-600 hover:bg-red-50/50 hover:text-red-700')}>
                <span className="text-lg">🚨</span><span>Historial de Caídas</span>
              </Link>

              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-red-600/20"
              >
                Reportar Caída Masiva
              </button>
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

      {/* COMPONENTES GLOBALES */}
      <GlobalRequestWidget />
      <MajorIncidentBanner />
      <GlobalAnnounceBanner /> {/* Inyección de Difusión de Anuncios */}

      {/* MODAL: Declaración de Incidente */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Declaración de Incidente Mayor">
        <form onSubmit={handleReportDowntime} className="space-y-5 py-2">
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-xs text-red-700 font-medium">
            Al confirmar esta acción, se teñirá la plataforma de rojo y se disparará una alerta con cronómetro en las pantallas del departamento destino.
          </div>
          
          <Input label="Título de la Falla" required placeholder="Ej: Caída de Base de Datos Principal" value={reportTitle} onChange={(e: any) => setReportTitle(e.target.value)} />
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción y Síntomas</label>
            <textarea required rows={3} placeholder="Describa el impacto actual..." value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-500/20 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Alcance de la Alerta</label>
            <select value={reportDept} onChange={(e) => setReportDept(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none">
              <option value="TODOS">Alerta Global (Toda la Empresa)</option>
              <option value="CAE">Exclusivo Soporte CAE</option>
              <option value="TI">Exclusivo Operaciones TI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Captura de la Falla (Recomendado)</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => imageInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                  📎 Adjuntar Captura
                </button>
                {screenshotPreview && <span className="text-xs text-emerald-600 font-bold">✓ Imagen adjuntada</span>}
              </div>
              {screenshotPreview && (
                <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                  <img src={screenshotPreview} alt="Preview" className="w-full h-auto object-cover" />
                  <button type="button" onClick={() => setScreenshotPreview(null)} className="absolute top-1 right-1 bg-white/80 p-1 rounded hover:bg-red-50 hover:text-red-500 text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsReportModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" isLoading={isReporting}>Activar Alerta Roja</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}