'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/SelectMenu' 
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
  const [currentArea, setCurrentArea] = useState<string>(
    initialData?.area || (area === 'global' ? defaultArea : area)
  )
  
  const [prioridad, setPrioridad] = useState(initialData?.prioridad || 'Normal')
  const [origen, setOrigen] = useState(initialData?.origen || 'Usuario')
  const [solucionQuery, setSolucionQuery] = useState(initialData?.solucion_query || '')

  const isEditing = !!initialData?.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedFileName, setAttachedFileName] = useState<string | null>(
    initialData?.archivo_url ? 'Documento adjunto existente' : null
  )

  const areaGroups = user?.department === 'TI'
    ? [
        {
          label: 'Operaciones TI',
          options: [
            { value: 'categoria_1', label: 'Categoría 1' },
            { value: 'categoria_2', label: 'Categoría 2' },
            { value: 'categoria_3', label: 'Categoría 3' },
            { value: 'categoria_4', label: 'Categoría 4' },
            { value: 'categoria_5', label: 'Categoría 5' },
            { value: 'categoria_6', label: 'Categoría 6' }
          ]
        }
      ]
    : [
        {
          label: 'Exodus',
          options: [
            { value: 'exodus_mostradores', label: 'Exodus Mostradores' },
            { value: 'exodus_sucursales', label: 'Exodus Sucursales' },
            { value: 'exodus_sucursales_sic', label: 'Exodus Sucursales SIC' },
            { value: 'exodus_erp_profesional', label: 'Exodus ERP Profesional' },
            { value: 'exodus_profesional_2013', label: 'Exodus Profesional 2013' },
            { value: 'exodus_embarques', label: 'Exodus Embarques' },
            { value: 'exodus_epico', label: 'Exodus Épico' }
          ]
        },
        {
          label: 'Otras Áreas',
          options: [
            { value: 'almacen', label: 'Almacén' },
            { value: 'credito', label: 'Crédito' },
            { value: 'pinpad', label: 'Pinpad' },
            { value: 'embarques', label: 'Embarques' },
            { value: 'movil', label: 'Móvil' }
          ]
        },
        {
          label: 'Información General',
          options: [
            { value: 'full_info', label: 'Full Información' }
          ]
        }
      ]

  const priorityOptions = [
    { value: 'Común', label: 'Común' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Raro', label: 'Raro' }
  ]

  const originOptions = [
    { value: 'Usuario', label: 'Usuario' },
    { value: 'Sistemas', label: 'Sistemas' }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
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
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && !isSuperAdmin && !editObservation.trim()) {
      alert('Debes ingresar una justificación para solicitar la edición de este ticket.')
      return
    }

    setIsLoading(true)
    
    let finalArchivoUrl = initialData?.archivo_url || null

    if (attachedFile) {
      const fileExt = attachedFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('adjuntos')
        .upload(fileName, attachedFile)

      if (uploadError) {
        console.error('Error al subir documento:', uploadError)
        alert('Error al subir el documento: ' + uploadError.message)
        setIsLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('adjuntos').getPublicUrl(fileName)
      finalArchivoUrl = urlData.publicUrl
    }

    const payload: any = {
      title,
      code: code || null,
      description,
      steps,
      screenshot_url: preview,
      area: currentArea, 
      prioridad,
      origen,
      solucion_query: solucionQuery,
      departamento: user?.department || 'CAE',
      archivo_url: finalArchivoUrl
    }

    if (isEditing) {
      payload.modificado_por = user?.name || 'Usuario Desconocido'
    } else {
      payload.creado_por = user?.name || 'Usuario Desconocido'
      payload.modificado_por = null
    }

    if (isEditing && !isSuperAdmin) {
      const { error } = await supabase.from('solicitudes_cambio').insert([{
        solicitante: user?.name || 'Administrador',
        tipo_solicitud: 'EDITAR_TICKET',
        tabla_destino: 'errors',
        registro_id: initialData.id.toString(),
        observacion: editObservation,
        informacion_cambio: payload
      }])

      if (error) {
        alert('Error al enviar la solicitud: ' + error.message)
      } else {
        alert('Tu solicitud de edición ha sido enviada a la Bandeja de Autorizaciones.')
        onSuccess(null)
      }
    } else {
      let result;
      if (isEditing) {
        result = await supabase.from('errors').update(payload).eq('id', initialData.id).select()
      } else {
        result = await supabase.from('errors').insert([payload]).select()
      }

      const { data, error } = result;

      if (error) {
        console.error('Error al guardar en Supabase:', error)
        alert('Error al guardar: ' + error.message)
      } else {
        const accionLog = isEditing ? 'EDITADO' : 'CREADO';
        await supabase.from('audit_logs').insert([{
          accion: accionLog,
          ticket_titulo: title,
          usuario: user?.name || 'Desconocido',
          departamento: user?.department || 'CAE'
        }]);

        onSuccess(data)
      }
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh]">
      {/* Contenedor escroleable interno con Grid de 2 columnas */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA: Datos Generales */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Captura del error</label>
              <div onClick={() => fileInputRef.current?.click()} className={cn('relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer hover:border-exodus-400 hover:bg-exodus-50/50', preview ? 'border-exodus-300 bg-exodus-50' : 'border-slate-200')}>
                {preview ? (
                  <div className="relative aspect-video">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-500 hover:text-slate-700 shadow-sm">X</button>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-xs text-slate-600">Clic para subir imagen</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            <Input label="Título del error" placeholder="Ej: Error de conexión" required value={title} onChange={(e: any) => setTitle(e.target.value)} />
            <Input label="Código de error" placeholder="Ej: ERR_500" value={code} onChange={(e: any) => setCode(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-4">
              <Select label="Prioridad" value={prioridad} onChange={setPrioridad} options={priorityOptions} />
              <Select label="Origen" value={origen} onChange={setOrigen} options={originOptions} />
            </div>
            <Select label="Área Operativa" value={currentArea} onChange={setCurrentArea} groups={areaGroups} />
          </div>

          {/* COLUMNA DERECHA: Detalles Técnicos y Evidencias */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción breve</label>
              <textarea rows={2} placeholder="Describe brevemente cuándo ocurre..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-900 focus:outline-none focus:ring-2 focus:ring-exodus-500/20 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Query de Solución (Opcional)</label>
              <textarea rows={2} placeholder="Pega aquí tu query .sql o pasos..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-exodus-500/20" value={solucionQuery} onChange={(e) => setSolucionQuery(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pasos de la solución</label>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} placeholder={`Paso ${index + 1}`} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-exodus-500/20" />
                    {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="text-slate-400 hover:text-red-500 text-xs font-bold">Quitar</button>}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addStep} className="mt-2 text-xs text-exodus-600 font-bold bg-exodus-50 px-3 py-1.5 rounded-lg">+ Añadir paso</button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Documentos (PDF, Excel)</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => documentInputRef.current?.click()} className="px-3 py-1.5 bg-white text-slate-700 font-medium text-xs rounded-lg border border-slate-200 shadow-sm hover:bg-slate-100 transition-colors">📎 Adjuntar</button>
                {attachedFileName && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-exodus-100/50 border border-exodus-200 rounded-md max-w-[150px]">
                    <span className="text-[10px] text-exodus-700 font-bold truncate">{attachedFileName}</span>
                    <button type="button" onClick={() => { setAttachedFile(null); setAttachedFileName(null); }} className="text-exodus-400 hover:text-red-500"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                )}
              </div>
              <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" onChange={handleDocumentChange} className="hidden" />
            </div>

            {isEditing && !isSuperAdmin && (
              <div className="pt-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Justificación de la edición</label>
                <textarea rows={1} placeholder="Por qué necesitas modificar esto..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-exodus-500/20 text-sm" value={editObservation} onChange={(e) => setEditObservation(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER FIJO (Siempre visible, no hay que scrolear) */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-md pt-4 pb-2 border-t border-slate-100 mt-2 flex gap-3 z-10">
        <Button type="button" variant="secondary" className="flex-1 py-3" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/30" isLoading={isLoading}>
          {isLoading ? 'Procesando...' : (isEditing ? (!isSuperAdmin ? 'Enviar Autorización' : 'Guardar Cambios') : 'Crear ErrorCard')}
        </Button>
      </div>
    </form>
  )
}