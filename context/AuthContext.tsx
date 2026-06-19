'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface AuthContextType extends AuthState {
  login: (username: string, password: string, area: 'CAE' | 'TI') => Promise<{success: boolean, error?: string}>
  logout: () => void
  isAdmin: boolean
  isSuperAdmin: boolean
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
    
    const { data: userRecord, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', cleanUsername)
      .single()
    
    if (error || !userRecord || userRecord.password !== password) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }

    if (!userRecord.departments.includes(selectedArea)) {
      return { success: false, error: `No tienes permisos para acceder a ${selectedArea}` }
    }
    
    const userSession: User = {
      id: userRecord.id.toString(),
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role as 'admin' | 'user',
      departments: userRecord.departments,
      department: selectedArea,
      is_superadmin: userRecord.is_superadmin
    }

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
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      isAdmin: authState.user?.role === 'admin',
      isSuperAdmin: authState.user?.is_superadmin || false
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}