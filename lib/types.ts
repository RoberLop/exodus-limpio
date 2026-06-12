export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  department: OperationalArea
}

// Actualizamos la lista con las subcategorías y la sección de info
export type OperationalArea = 
  | 'exodus' 
  | 'exodus_mostradores' 
  | 'exodus_sucursales' 
  | 'exodus_sucursales_sic' 
  | 'exodus_erp_profesional' 
  | 'exodus_profesional_2013' 
  | 'exodus_embarques' 
  | 'exodus_epico' 
  | 'almacen' 
  | 'credito' 
  | 'pinpad' 
  | 'embarques' 
  | 'movil' 
  | 'admin' 
  | 'sistemas' 
  | 'full_info'

export interface ErrorSolution {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  steps: string[]
  createdAt: Date
  upvotes: number
  isMainSolution: boolean
}

export interface ErrorCard {
  id: string
  title: string
  code?: string
  description: string
  screenshotUrl: string
  area: OperationalArea
  solutions: ErrorSolution[]
  mainSolution: ErrorSolution
  createdAt: Date
  updatedAt: Date
  createdBy: string
  tags: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}