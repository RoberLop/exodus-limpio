'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState } from '@/lib/types'
import { supabase } from '@/lib/supabase' // <-- Importamos la conexión a tu base de datos

interface AuthContextType extends AuthState {
  login: (username: string, password: string, area: 'CAE' | 'TI') => Promise<{success: boolean, error?: string}>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('exodus_user')
    if (storedUser) {
      setAuthState({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false })
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (username: string, password: string, selectedArea: 'CAE' | 'TI'): Promise<{success: boolean, error?: string}> => {
    const cleanUsername = username.toLowerCase().trim()
    
    // 1. Buscamos al usuario directamente en Supabase
    const { data: userRecord, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', cleanUsername)
      .single()
    
    // 2. Si no existe o la contraseña no cuadra, lo rebotamos
    if (error || !userRecord || userRecord.password !== password) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }

    // 3. Verificamos que el usuario TENGA PERMISO para entrar al área seleccionada
    if (!userRecord.departments.includes(selectedArea)) {
      return { success: false, error: `No tienes permisos para acceder a ${selectedArea}` }
    }
    
    // 4. Armamos su sesión con los datos que trajo la base de datos
    const userSession: User = {
      id: userRecord.id.toString(),
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role as 'admin' | 'user',
      departments: userRecord.departments,
      department: selectedArea
    }

    // 5. Lo dejamos pasar
    localStorage.setItem('exodus_user', JSON.stringify(userSession))
    setAuthState({
      user: userSession,
      isAuthenticated: true,
      isLoading: false,
    })
    
    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem('exodus_user')
    setAuthState({ user: null, isAuthenticated: false, isLoading: false })
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isAdmin: authState.user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}