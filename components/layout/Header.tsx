'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NewErrorForm } from '@/components/forms/NewErrorForm'
import { useAuth } from '@/context/AuthContext'
import { areaLabels } from '@/lib/utils'
import { OperationalArea } from '@/lib/types'

interface HeaderProps {
  area: OperationalArea
  errorCount: number
  onAddError?: (data: any) => void
}

export function Header({ area, errorCount, onAddError }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isAdmin } = useAuth()

  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {/* Si areaLabels[area] no existe, usamos el valor de area capitalizado */}
            {areaLabels[area] || area.charAt(0).toUpperCase() + area.slice(1)}
          </h1>
          <p className="mt-1 text-slate-500">
            {errorCount} {errorCount === 1 ? 'error documentado' : 'errores documentados'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar errores..."
              className="w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-exodus-500/20 focus:border-exodus-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Error
          </Button>
        </div>
      </header>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Documentar Nuevo Error"
        description="Sube una captura del error y describe la solución"
        size="lg"
      >
        <NewErrorForm
          area={area}
          onSuccess={(data) => {
            setIsModalOpen(false)
            if (onAddError && data) {
              onAddError(data)
            }
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  )
}