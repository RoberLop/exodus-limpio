'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { ErrorGrid } from '@/components/errors/ErrorGrid'
import { supabase } from '@/lib/supabase'

export default function CreditoPage() {
  const [errors, setErrors] = useState<any[]>([])

  const fetchErrors = async () => {
    const { data } = await supabase
      .from('errors')
      .select('*')
      .eq('area', 'credito') // Aquí filtramos específicamente por 'credito'
      .order('created_at', { ascending: false })
    
    if (data) {
      const formatted = data.map(item => ({
        ...item,
        screenshotUrl: item.screenshot_url,
        steps: item.steps || []
      }))
      setErrors(formatted)
    }
  }

  useEffect(() => {
    fetchErrors()
  }, [])

  const handleDelete = async (id: string) => {
    await supabase.from('errors').delete().eq('id', id)
    fetchErrors() // Recargamos la lista tras borrar
  }

  return (
    <div>
      {/* Pasamos fetchErrors a la cabecera para que recargue al agregar un error */}
      <Header area="credito" errorCount={errors.length} onAddError={fetchErrors} />
      <ErrorGrid errors={errors} onDelete={handleDelete} />
    </div>
  )
}