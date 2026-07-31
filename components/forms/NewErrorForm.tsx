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

  // 🛡️ ARREGLO UX: Bloquear el scroll de la página de fondo
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
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

  // ESTRUCTURA ULTRA-COMPACTA SIN SCROLL
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Evidencia / Captura</label>
            <div onClick={() => fileInputRef.current?.click()} className={cn('relative border-2 border-dashed rounded-lg transition-all cursor-pointer flex items-center justify-center overflow-hidden', preview ? 'border-sky-300 bg-slate-50 h-20' : 'border-slate-300 hover:bg-slate-50 h-14')}>
              {preview ? (
                <>
                  <img src={preview} className="w-full h-full object-contain" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded text-red-500 text-[10px] font-bold">X</button>
                </>
              ) : <span className="text-[11px] font-medium text-slate-500">📎 Clic para subir imagen</span>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Título del Ticket</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Error de conexión..." className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-sky-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Prioridad</label>
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-sky-400 bg-white">
                {priorityOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Origen</label>
              <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-sky-400 bg-white">
                {originOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Código Error</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: 500" className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-sky-400" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Área Operativa</label>
              <select value={currentArea} onChange={(e) => setCurrentArea(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-sky-400 bg-white">
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
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción Breve</label>
            <textarea rows={1} placeholder="Cuándo ocurre..." className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-sky-400 custom-scrollbar" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Query SQL (Opcional)</label>
            <textarea rows={1} placeholder="Pega tu .sql..." className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-sky-400 custom-scrollbar" value={solucionQuery} onChange={(e) => setSolucionQuery(e.target.value)} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Pasos Técnicos</label>
            <div className="space-y-1.5">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} placeholder={`Paso ${index + 1}`} className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:border-sky-400" />
                  {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="text-red-500 text-[10px] font-black px-1 hover:bg-red-50 rounded">X</button>}
                </div>
              ))}
            </div>
            {steps.length < 5 && <button type="button" onClick={addStep} className="mt-1.5 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded hover:bg-sky-100">+ Añadir paso</button>}
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Documento Extra</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => documentInputRef.current?.click()} className="text-[10px] px-2 py-1 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-100 font-medium">📎 Adjuntar PDF/Excel</button>
              {attachedFileName && <span className="text-[9px] text-sky-700 font-bold truncate max-w-[80px]">{attachedFileName}</span>}
            </div>
            <input ref={documentInputRef} type="file" onChange={handleDocumentChange} className="hidden" />
          </div>

          {isEditing && !isSuperAdmin && (
            <div>
              <label className="block text-[11px] font-bold text-red-600 mb-1">Justificación (Requerida)</label>
              <input type="text" placeholder="Por qué modificas este ticket..." className="w-full px-3 py-1.5 rounded-lg border border-red-200 text-xs outline-none focus:border-red-400 bg-red-50" value={editObservation} onChange={(e) => setEditObservation(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
        <Button type="button" variant="secondary" className="flex-1 py-2 text-xs" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1 py-2 text-xs bg-sky-600 hover:bg-sky-700 shadow-md" isLoading={isLoading}>
          {isLoading ? 'Guardando...' : (isEditing ? (!isSuperAdmin ? 'Enviar a Autorización' : 'Guardar Cambios') : 'Crear ErrorCard')}
        </Button>
      </div>
    </form>
  )
}