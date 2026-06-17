import { Anuncios } from '@/components/ui/Anuncios'

export default function InformacionPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centro de Información</h1>
          <p className="mt-1 text-sm text-slate-500">
            Avisos, reglas y comunicados importantes para tu departamento.
          </p>
        </div>
      </div>

      {/* Aquí mandamos llamar al tablero mágico de anuncios */}
      <Anuncios />
    </div>
  )
}