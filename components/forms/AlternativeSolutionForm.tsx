'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'

export const AlternativeSolutionForm = ({ onSuccess }: any) => {
  const [steps, setSteps] = useState([{ text: '', image: null as string | null }])
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const addStep = () => setSteps([...steps, { text: '', image: null }])

  const handleImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newSteps = [...steps]
        newSteps[index].image = reader.result as string
        setSteps(newSteps)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <textarea
            className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-slate-900"
            placeholder={`Paso ${index + 1}...`}
            onChange={(e) => {
              const newSteps = [...steps]; newSteps[index].text = e.target.value; setSteps(newSteps);
            }}
          />
          <input type="file" ref={el => { fileInputRefs.current[index] = el }} className="hidden" accept="image/*" onChange={(e) => handleImage(index, e)} />
          <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => fileInputRefs.current[index]?.click()}>
            {step.image ? '📸 Foto cargada ✅' : '🖼️ Adjuntar foto'}
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" onClick={addStep} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg">+ Agregar paso</button>
        <Button type="button" onClick={() => onSuccess({ steps })} className="flex-1">Guardar</Button>
      </div>
    </div>
  )
}