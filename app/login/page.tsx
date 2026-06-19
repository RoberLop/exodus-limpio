'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select' 
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedArea, setSelectedArea] = useState<'CAE' | 'TI'>('CAE')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Le mandamos el usuario, la contraseña y el área que eligió
      const result = await login(username, password, selectedArea)
      
      if (result.success) {
        router.push('/dashboard/global')
      } else {
        // Mostramos el error específico sin reiniciar el estado del selector
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err: any) {
      console.error('Error durante el inicio de sesión:', err)
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Opciones para nuestro nuevo Select
  const loginOptions = [
    { value: 'CAE', label: 'Soporte CAE' },
    { value: 'TI', label: 'Operaciones TI' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-exodus-500 to-exodus-700 flex items-center justify-center shadow-xl shadow-exodus-500/30">
            <span className="text-white font-bold text-3xl">E</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Exodus</h1>
          <p className="mt-1 text-slate-500">Base de conocimiento interna</p>
        </div>

        {/* Login form */}
        <div className="glass rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* EL MENU DESPLEGABLE SIN ÍCONO (PERO ALINEADO) */}
            <Select 
              label="Área de acceso"
              value={selectedArea}
              onChange={(val) => setSelectedArea(val as 'CAE' | 'TI')}
              options={loginOptions}
              icon={<div className="w-5 h-5" />} 
            />

            <Input
              label="Usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: Rober CAE"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              error={error}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Selecciona el área e ingresa con tu nombre de usuario asignado.
            </p>
          </div>
        </div>
      </div>

      {/* Firma de creador */}
      <div className="fixed bottom-4 right-6 opacity-50 hover:opacity-100 transition-opacity z-50 pointer-events-none">
        <p className="text-[11px] font-medium text-slate-500 tracking-wide">
          &lt;/&gt; Desarrollado por Rober López
        </p>
      </div>
    </div>
  )
}