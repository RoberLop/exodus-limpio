'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState } from '@/lib/types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Usuario mock para desarrollo
const mockUsers: Record<string, User> = {
  'admin@exodus.com': {
    id: '1',
    name: 'Exodus Admin',
    email: 'admin@exodus.com',
    role: 'admin',
    department: 'credito',
    avatar: '/avatars/admin.jpg',
  },
  'user@exodus.com': {
    id: '2',
    name: 'María Usuario',
    email: 'user@exodus.com',
    role: 'user',
    department: 'pinpad',
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    // Verificar sesión existente
    const storedUser = localStorage.getItem('exodus_user')
    if (storedUser) {
      setAuthState({
        user: JSON.parse(storedUser),
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const user = mockUsers[email.toLowerCase()]
    if (user && password.length >= 4) {
      localStorage.setItem('exodus_user', JSON.stringify(user))
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('exodus_user')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAdmin: authState.user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
