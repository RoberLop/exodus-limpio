import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Exodus KB - Base de Conocimiento',
  description: 'Sistema interno de documentación de errores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}