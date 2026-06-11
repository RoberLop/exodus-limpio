'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AlternativeSolutionForm } from '../forms/AlternativeSolutionForm'

export function AlternativeSolutions({ errorId, solutions }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-white">Soluciones alternativas</h4>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>+ Agregar</Button>
      </div>

      <div className="space-y-3">
        {solutions?.map((sol: any, i: number) => (
          <div key={i} className="p-3 bg-white/5 rounded-lg text-sm text-slate-300 border border-white/10">
            {sol.text}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva solución" size="md">
        <AlternativeSolutionForm 
          errorId={errorId} 
          onSuccess={(data: any) => {
            console.log("Datos guardados:", data);
            setIsModalOpen(false);
          }} 
        />
      </Modal>
    </div>
  )
}