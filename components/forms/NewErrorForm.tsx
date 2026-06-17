'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
  const { user } = useAuth()
  
  const [preview, setPreview] = useState<string | null>(initialData?.screenshot_url || null)
  const [steps, setSteps] = useState<string[]>(initialData?.steps?.length ? initialData.steps : [''])
  
  const [title, setTitle] = useState(initialData?.title || '')
  const [code, setCode] = useState(initialData?.code || '')
  const [description, setDescription] = useState(initialData?.description || '')
  
  // Dependiendo si es TI o CAE, ponemos una por defecto distinta al crear desde Global
  const defaultArea = user?.department === 'TI' ? 'categoria_1' : 'exodus_mostradores'
  const [currentArea, setCurrentArea] = useState<string>(
    initialData?.area || (area === 'global' ? defaultArea : area)
  )
  
  const [prioridad, setPrioridad] = useState(initialData?.prioridad || 'Normal')
  const [origen, setOrigen] = useState(initialData?.origen || 'Usuario')
  const [solucionQuery, setSolucionQuery] = useState(initialData?.solucion_query || '')

  const isEditing = !!initialData?.id
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setIsLoading(true)
    
    // 1. Aquí inyectamos el departamento al payload
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
      departamento: user?.department || 'CAE' // <-- GUARDA SI ES DE TI O CAE
    }

    if (isEditing) {
      payload.modificado_por = user?.name || 'Usuario Desconocido'
    } else {
      payload.creado_por = user?.name || 'Usuario Desconocido'
      payload.modificado_por = null
    }

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
      // 2. Aquí también le decimos a los logs a qué departamento pertenece el movimiento
      await supabase.from('audit_logs').insert([{
        accion: accionLog,
        ticket_titulo: title,
        usuario: user?.name || 'Desconocido',
        departamento: user?.department || 'CAE' // <-- GUARDA EN LOGS
      }]);

      onSuccess(data)
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Captura del error</label>
        <div onClick={() => fileInputRef.current?.click()} className={cn('relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer hover:border-exodus-400 hover:bg-exodus-50/50', preview ? 'border-exodus-300 bg-exodus-50' : 'border-slate-200')}>
          {preview ? (
            <div className="relative aspect-video">
              <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
              <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-500 hover:text-slate-700 shadow-sm">
                X
              </button>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-sm text-slate-600">Haz clic para subir una imagen</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      <Input label="Título del error" placeholder="Ej: Error de conexión" required value={title} onChange={(e: any) => setTitle(e.target.value)} />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Área Operativa</label>
          <select value={currentArea} onChange={(e) => setCurrentArea(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-exodus-500/20 text-sm">
            {/* RENDERIZADO INTELIGENTE DE ÁREAS */}
            {user?.department === 'TI' ? (
              <optgroup label="Operaciones TI">
                <option value="categoria_1">Categoría 1</option>
                <option value="categoria_2">Categoría 2</option>
                <option value="categoria_3">Categoría 3</option>
                <option value="categoria_4">Categoría 4</option>
                <option value="categoria_5">Categoría 5</option>
                <option value="categoria_6">Categoría 6</option>
              </optgroup>
            ) : (
              <>
                <optgroup label="Exodus">
                  <option value="exodus_mostradores">Exodus Mostradores</option>
                  <option value="exodus_sucursales">Exodus Sucursales</option>
                  <option value="exodus_sucursales_sic">Exodus Sucursales SIC</option>
                  <option value="exodus_erp_profesional">Exodus ERP Profesional</option>
                  <option value="exodus_profesional_2013">Exodus Profesional 2013</option>
                  <option value="exodus_embarques">Exodus Embarques</option>
                  <option value="exodus_epico">Exodus Épico</option>
                </optgroup>
                <optgroup label="Otras Áreas">
                  <option value="almacen">Almacén</option>
                  <option value="credito">Crédito</option>
                  <option value="pinpad">Pinpad</option>
                  <option value="embarques">Embarques</option>
                  <option value="movil">Móvil</option>
                </optgroup>
              </>
            )}
            <optgroup label="Información General">
              <option value="full_info">Full Información</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridad</label>
          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-exodus-500/20 text-sm">
            <option value="Común">Común</option>
            <option value="Normal">Normal</option>
            <option value="Raro">Raro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Origen</label>
          <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-exodus-500/20 text-sm">
            <option value="Usuario">Usuario</option>
            <option value="Sistemas">Sistemas</option>
          </select>
        </div>
      </div>

      <Input label="Código de error" placeholder="Ej: ERR_500" value={code} onChange={(e: any) => setCode(e.target.value)} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción breve</label>
        <textarea rows={2} placeholder="Describe brevemente cuándo ocurre..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 focus:outline-none focus:ring-2 focus:ring-exodus-500/20" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Query de Solución (Opcional)</label>
        <textarea rows={3} placeholder="Pega aquí tu query .sql o pasos técnicos..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-exodus-500/20" value={solucionQuery} onChange={(e) => setSolucionQuery(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Pasos de la solución</label>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <input type="text" value={step} onChange={(e) => updateStep(index, e.target.value)} placeholder={`Paso ${index + 1}`} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-exodus-500/20" />
              {steps.length > 1 && <button type="button" onClick={() => removeStep(index)} className="text-slate-400 hover:text-red-500">Eliminar</button>}
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-2 text-sm text-exodus-600 font-medium">+ Agregar paso</button>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {isEditing ? 'Guardar Cambios' : 'Guardar error'}
        </Button>
      </div>
    </form>
  )
}