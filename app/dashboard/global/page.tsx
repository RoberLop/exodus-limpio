import { ErrorAreaPage } from '@/components/errors/ErrorAreaPage'
import { Anuncios } from '@/components/ui/Anuncios' 

export default function Page() {
  return (
    <div className="space-y-4">
      {}
      <Anuncios />
      
      {}
      <ErrorAreaPage areaName="global" />
    </div>
  )
}