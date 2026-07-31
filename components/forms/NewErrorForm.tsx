'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface NewErrorFormProps {
  area: string
  initialData?: any
  onSuccess: (data?: any) => void
  onCancel: () => void
}

export function NewErrorForm({ area, initialData, onSuccess, onCancel }: NewErrorFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user, isSuperAdmin } = useAuth() 
  
  const [preview, setPreview] = useState<string | null>(initialData?.screenshot_url || null)
  const [steps, setSteps] = useState<string[]>(initialData?.steps?.length ? initialData.steps : [''])
  const [title, setTitle] = useState(initialData?.title || '')
  const [code, setCode] = useState(initialData?.code || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [editObservation, setEditObservation] = useState('')

  const defaultArea = user?.department === 'TI' ? 'categoria_1' : 'exodus_mostradores'
  const [currentArea, setCurrentArea] = useState<string>(initialData?.area || (area === 'global' ? defaultArea : area))
  const [prioridad, setPrioridad] = useState(initialData?.prioridad || 'Normal')
  const [origen, setOrigen] = useState(initialData?.origen || 'Usuario')
  const [solucionQuery, setSolucionQuery] = useState(initialData?.solucion_query || '')

  const isEditing = !!initialData?.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedFileName, setAttachedFileName] = useState<string | null>(initialData?.archivo_url ? 'Adjunto existente' : null)

  // Bloqueamos el scroll de la página de fondo para evitar el "Doble Scroll"
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const areaGroups = user?.department === 'TI'
    ? [
        {
          label: 'Operaciones TI',
          options: [
            { value: 'categoria_1', label: 'Categoría 1' }, { value: 'categoria_2', label: 'Categoría 2' },
            { value: 'categoria_3', label: 'Categoría 3' }, { value: 'categoria_4', label: 'Categoría 4' },
            { value: 'categoria_5', label: 'Categoría 5' }, { value: 'categoria_6', label: 'Categoría 6' }
          ]
        }
      ]
    : [
        {
          label: 'Exodus',
          options: [
            { value: 'exodus_mostradores', label: 'Mostradores' }, { value: 'exodus_sucursales', label: 'Sucursales' },
            { value: 'exodus_sucursales_sic', label: 'Sucursales SIC' }, { value: 'exodus_erp_profesional', label: 'ERP Profesional' },
            { value: 'exodus_profesional_2013', label: 'Profesional 2013' }, { value: 'exodus_embarques', label: 'Embarques' },
            { value: 'exodus_epico', label: 'Épico' }
          ]
        },
        {
          label: 'Otras Áreas',
          options: [
            { value: 'almacen', label: 'Almacén' }, { value: 'credito', label: 'Crédito' },
            { value: 'pinpad', label: 'Pinpad' }, { value: 'embarques', label: 'Embarques' },
            { value: 'movil', label: 'Móvil' }
          ]
        },
        { label: 'General', options: [{ value: 'full_info', label: 'Full Información' }] }
      ]

  const priorityOptions = ['Común', 'Normal', 'Raro']
  const originOptions = ['Usuario', 'Sistemas']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachedFile(file)
      setAttachedFileName(file.name)
    }
  }

  const addStep = () => setSteps([...steps, ''])
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
  }
  const removeStep = (index: number) => {
    if (steps.length > 1) setSteps(steps.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing && !isSuperAdmin && !editObservation.trim()) {
      alert('Debes ingresar una justificación para editar.')
      return
    }

    setIsLoading(true)
    let finalArchivoUrl = initialData?.archivo_url || null

    if (attachedFile) {
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${attachedFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('adjuntos').upload(fileName, attachedFile)
      if (uploadError) {
        alert('Error al subir el documento: ' + uploadError.message)
        setIsLoading(false)
        return
      }
      finalArchivoUrl = supabase.storage.from('adjuntos').getPublicUrl(fileName).data.publicUrl
    }

    const payload: any = {
      title, code: code || null, description, steps, screenshot_url: preview,
      area: currentArea, prioridad, origen, solucion_query: solucionQuery,
      departamento: user?.department || 'CAE', archivo_url: finalArchivoUrl,
      modificado_por: isEditing ? user?.name : null,
      creado_por: isEditing ? initialData?.creado_por : user?.name
    }

    if (isEditing && !isSuperAdmin) {
      const { error } = await supabase.from('solicitudes_cambio').insert([{
        solicitante: user?.name, tipo_solicitud: 'EDITAR_TICKET', tabla_destino: 'errors',
        registro_id: initialData.id.toString(), observacion: editObservation, informacion_cambio: payload
      }])
      if (!error) {
        alert('Solicitud enviada a Autorizaciones.')
        onSuccess(null)
      } else alert('Error: ' + error.message)
    } else {
      const { data, error } = isEditing 
        ? await supabase.from('errors').update(payload).eq('id', initialData.id).select()
        : await supabase.from('errors').insert([payload]).select()

      if (!error) {
        await supabase.from('audit_logs').insert([{ accion: isEditing ? 'EDITADO' : 'CREADO', ticket_titulo: title, usuario: user?.name, departamento: user?.department }]);
        onSuccess(data)
      } else alert('Error: ' + error.message)
    }
    setIsLoading(false)
  }

  return (
    // Limitamos la altura máxima del formulario para que no desborde la pantalla, obligando al scroll interno.
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-h-[75vh]">
      
      {/* CUERPO DEL FORMULARIO CON SCROLL INTERNO Y GRID RESPONSIVE */}
      <div className="flex-1 overflow-y-auto pr-3 pb-4 custom-scrollbar">
        {/* 1 columna en celular, 2 columnas en PC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Evidencia / Captura</label>
              <div onClick={() => fileInputRef.current?.click()} className={cn('relative border-2 border-dashed rounded-xl transition-all cursor-pointer flex items-center justify-center overflow-hidden', preview ? 'border-sky-300 bg-slate-50 min-h-[160px]' : 'border-slate-300 hover:bg-slate-50 min-h-[120px]')}>
                {preview ? (
                  <>
                    <img src={preview} className="w-full h-full object-contain" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-md text-red-500 text-xs font-black shadow-sm">X</button>
                  </>
                ) : <div className="text-center text-slate-500"><div className="text-2xl mb-1">📎</div><span className="text-xs font-medium">Clic para subir imagen</span></div>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Título del Ticket</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Error de conexión en caja..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 bg-slate-50 shadow-inner transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Prioridad</label>
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 bg-slate-50 shadow-inner">
                  {priorityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Origen</label>
                <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 bg-slate-50 shadow-inner">
                  {originOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Código Error</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: 500" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 bg-slate-50 shadow-inner transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Área Operativa</label>
                <select value={currentArea} onChange={(e) => setCurrentArea(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 bg-slate-50 shadow-inner">
                  {areaGroups.map((g, i) => (
                    <optgroup key={i} label={g.label}>
                      {g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción Breve</label>
              <textarea rows={3} placeholder="Describe el problema a detalle..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 bg-slate-50 shadow-inner transition-all resize-none custom-scrollbar" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Query SQL (Opcional)</label>
              <textarea rows={3} placeholder="Pega tu .sql o script técnico..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 bg-[#0f172a] text-emerald-400 shadow-inner transition-all resize-none custom-scrollbar" value={solucionQuery} onChange={(e) => setSolucionQuery(e.target.value)} />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-sm font-bold text-slate-700 mb-3">Pasos Técnicos</label>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} placeholder={`Paso ${index + 1}`} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/10 bg-white shadow-sm" />
                    {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="text-slate-400 hover:text-red-500 text-sm font-black px-2 hover:bg-red-50 rounded-lg transition-colors">X</button>}
                  </div>
                ))}
              </div>
              {/* Sin límite de pasos */}
              <button type="button" onClick={addStep} className="mt-3 text-xs font-bold text-sky-600 bg-sky-100/50 border border-sky-200 px-3 py-2 rounded-lg hover:bg-sky-100 transition-colors shadow-sm w-full">+ Añadir nuevo paso</button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Documento Extra</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => documentInputRef.current?.click()} className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 font-bold transition-all">📎 Adjuntar Archivo</button>
                {attachedFileName && <span className="text-xs text-sky-700 font-bold truncate max-w-[120px]">{attachedFileName}</span>}
              </div>
              <input ref={documentInputRef} type="file" onChange={handleDocumentChange} className="hidden" />
            </div>

            {isEditing && !isSuperAdmin && (
              <div>
                <label className="block text-sm font-bold text-red-600 mb-1.5">Justificación (Requerida)</label>
                <textarea rows={2} placeholder="Explica por qué modificas este ticket..." className="w-full px-4 py-2.5 rounded-xl border border-red-200 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 bg-red-50 shadow-inner transition-all resize-none" value={editObservation} onChange={(e) => setEditObservation(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER FIJO - Nunca se esconde, siempre a la mano */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl pt-4 pb-1 border-t border-slate-100 mt-2 flex gap-4 z-10">
        <Button type="button" variant="secondary" className="flex-1 py-3 font-bold" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1 py-3 font-bold bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/30 text-white" isLoading={isLoading}>
          {isLoading ? 'Guardando...' : (isEditing ? (!isSuperAdmin ? 'Enviar a Autorización' : 'Guardar Cambios') : 'Crear ErrorCard')}
        </Button>
      </div>
    </form>
  )
}