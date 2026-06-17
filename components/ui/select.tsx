'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
  groups?: SelectGroup[]
  label?: string
  icon?: ReactNode // <-- NUEVO: Soporte para íconos
}

export function Select({ value, onChange, options, groups, label, icon }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  let selectedLabel = 'Seleccionar...'
  if (options) {
    const selected = options.find(o => o.value === value)
    if (selected) selectedLabel = selected.label
  } else if (groups) {
    for (const group of groups) {
      const selected = group.options.find(o => o.value === value)
      if (selected) {
        selectedLabel = selected.label
        break
      }
    }
  }

  return (
    <div className={cn("relative w-full", isOpen ? "z-50" : "z-10")} ref={ref}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">{label}</label>}
      
      <div className="relative">
        {/* Renderizamos el ícono si existe */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 flex items-center justify-center">
            {icon}
          </div>
        )}
        
        <div
          className={cn(
            "w-full py-3 rounded-xl border bg-white/80 text-sm cursor-pointer flex justify-between items-center transition-all",
            icon ? "pl-12 pr-4" : "px-4", // Si hay ícono, empujamos el texto a la derecha
            isOpen ? "border-exodus-500 ring-2 ring-exodus-500/20 shadow-sm" : "border-slate-200 hover:border-slate-300"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-slate-800 font-medium truncate">{selectedLabel}</span>
          <svg className={cn("w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ml-2", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute w-full mt-2 py-2 glass rounded-xl shadow-xl border border-white/40 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
          {options && options.map((opt) => (
            <div key={opt.value} className={cn("px-4 py-2.5 text-sm cursor-pointer transition-colors", value === opt.value ? "bg-exodus-50 text-exodus-700 font-bold" : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900")} onClick={() => { onChange(opt.value); setIsOpen(false) }}>
              {opt.label}
            </div>
          ))}
          {groups && groups.map((group, idx) => (
            <div key={idx} className="mb-2 last:mb-0">
              <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 border-y border-slate-100/50">{group.label}</div>
              {group.options.map((opt) => (
                <div key={opt.value} className={cn("px-4 py-2.5 text-sm cursor-pointer transition-colors pl-6", value === opt.value ? "bg-exodus-50 text-exodus-700 font-bold border-l-2 border-exodus-500" : "text-slate-600 border-l-2 border-transparent hover:bg-slate-50/80 hover:text-slate-900")} onClick={() => { onChange(opt.value); setIsOpen(false) }}>
                  {opt.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}