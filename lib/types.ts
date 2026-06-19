export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  departments: ('CAE' | 'TI')[]
  department?: 'CAE' | 'TI'    
  is_superadmin?: boolean
}

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
  | 'informacion'
  | 'categoria_1'
  | 'categoria_2'
  | 'categoria_3'
  | 'categoria_4'
  | 'categoria_5'
  | 'categoria_6'

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
  archivo_url?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}