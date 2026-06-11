export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  department: OperationalArea
}

export type OperationalArea = 'credito' | 'pinpad' | 'embarques' | 'movil' | 'admin'

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