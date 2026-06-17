'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState } from '@/lib/types'

interface AuthContextType extends AuthState {
  login: (username: string, password: string, area: 'CAE' | 'TI') => Promise<{success: boolean, error?: string}>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


const mockUsers: Record<string, Omit<User, 'department'>> = {
  // Equipo CAE (Solo acceso a CAE)
  'admin cae': { id: '1', name: 'ADMIN CAE', email: 'admin@exodus.com', role: 'admin', departments: ['CAE'] },
  'sergio cae': { id: '2', name: 'Sergio CAE', email: 'sergio@exodus.com', role: 'admin', departments: ['CAE'] },
  'fabian cae': { id: '3', name: 'Fabian CAE', email: 'fabian@exodus.com', role: 'user', departments: ['CAE'] },
  'luis cae': { id: '4', name: 'Luis CAE', email: 'luis@exodus.com', role: 'user', departments: ['CAE'] },
  'erick cae': { id: '5', name: 'Erick CAE', email: 'erick@exodus.com', role: 'user', departments: ['CAE'] },
  'william cae': { id: '6', name: 'William CAE', email: 'william@exodus.com', role: 'user', departments: ['CAE'] },
  'oscar cae': { id: '7', name: 'Oscar CAE', email: 'oscar@exodus.com', role: 'user', departments: ['CAE'] },
  'marcos cae': { id: '8', name: 'Marcos CAE', email: 'marcos@exodus.com', role: 'user', departments: ['CAE'] },
  'alejandro cae': { id: '10', name: 'Alejandro CAE', email: 'alejandro@exodus.com', role: 'user', departments: ['CAE'] },
  'kevin cae': { id: '11', name: 'Kevin CAE', email: 'kevin@exodus.com', role: 'user', departments: ['CAE'] },
  'ian cae': { id: '12', name: 'Ian CAE', email: 'ian@exodus.com', role: 'user', departments: ['CAE'] },
  'edgar cae': { id: '13', name: 'Edgar CAE', email: 'edgar@exodus.com', role: 'user', departments: ['CAE'] },
  'cristhian cae': { id: '14', name: 'Cristhian CAE', email: 'cristhian@exodus.com', role: 'user', departments: ['CAE'] },
  
  //  acceso a AMBOS departamentos
  'rober cae': { id: '9', name: 'Rober López', email: 'rober@exodus.com', role: 'admin', departments: ['CAE', 'TI'] },
  'admin': { id: '1', name: 'ADMIN CAE', email: 'admin@exodus.com', role: 'admin', departments: ['CAE', 'TI'] },

  // Equipo TI (Solo acceso a TI)
  'Marcos': { id: '15', name: 'Operaciones TI', email: 'ti@exodus.com', role: 'user', departments: ['TI'] }
}

const userPasswords: Record<string, string> = {
  'admin cae': 'alfa123',
  'sergio cae': 'tigre45',
  'fabian cae': 'rojo22',
  'luis cae': 'nube77',
  'erick cae': 'salto11',
  'william cae': 'dardo88',
  'oscar cae': 'faro33',
  'marcos cae': 'CRACK69',
  'rober cae': 'zorro55',
  'alejandro cae': 'roca44',
  'kevin cae': 'ola19',
  'ian cae': 'luna82',
  'edgar cae': 'mapa31',
  'cristhian cae': 'gato64',
  'Marcos': 'pesa44'
}

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
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const cleanUsername = username.toLowerCase().trim()
    const baseUser = mockUsers[cleanUsername]
    const correctPassword = userPasswords[cleanUsername]
    
    // 1. Verificamos que el usuario y la contraseña sean correctos
    if (!baseUser || correctPassword !== password) {
      return { success: false, error: 'Usuario o contraseña incorrectos' }
    }

    // 2. Verificamos que el usuario TENGA PERMISO para entrar al área seleccionada
    if (!baseUser.departments.includes(selectedArea)) {
      return { success: false, error: `No tienes permisos para acceder a ${selectedArea}` }
    }
    
    // 3. Creamos la sesión asignándole el departamento que eligió
    const userSession: User = {
      ...baseUser,
      department: selectedArea
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