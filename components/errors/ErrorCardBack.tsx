'use client'

import { useState } from 'react'
import { ErrorCard } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { AlternativeSolutions } from './AlternativeSolutions'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface ErrorCardBackProps {
  error: ErrorCard
  onFlipBack: () => void
  onAddSolution?: () => void
}

export function ErrorCardBack({ error, onFlipBack, onAddSolution }: ErrorCardBackProps) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const { isAdmin } = useAuth()
  const alternativeSolutions = error.solutions.filter(s => !s.isMainSolution)

  return (
    <div 
      className={cn(
        'h-full rounded-3xl overflow-hidden',
        'bg-white shadow-card',
        'border border-slate-100',
        'flex flex-col'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <span className="text-xs font-semibold text-exodus-600 uppercase tracking-wide">
            Solución
          </span>
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 mt-1">
            {error.title}
          </h3>
        </div>
        <button
          onClick={onFlipBack}
          className="p-2 -mr-2 -mt-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Solution steps */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-exodus-100 to-exodus-200 flex items-center justify-center">
            <span className="text-sm font-semibold text-exodus-700">
              {error.mainSolution.authorName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {error.mainSolution.authorName}
            </p>
            <p className="text-xs text-slate-500">
              Solución principal
            </p>
          </div>
        </div>

        <ol className="space-y-3">
          {error.mainSolution.steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-exodus-100 text-exodus-700 text-xs font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-sm text-slate-600 pt-0.5">{step}</p>
            </li>
          ))}
        </ol>

        {/* Alternative solutions dropdown */}
        {alternativeSolutions.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700">
                Soluciones alternativas ({alternativeSolutions.length})
              </span>
              <svg
                className={cn(
                  'w-5 h-5 text-slate-400 transition-transform duration-200',
                  showAlternatives && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAlternatives && (
              <AlternativeSolutions solutions={alternativeSolutions} />
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-slate-100 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={onAddSolution}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar alternativa
        </Button>
        
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="px-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}
