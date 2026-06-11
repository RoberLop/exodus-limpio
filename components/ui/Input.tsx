import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm',
              'text-slate-900 placeholder:text-slate-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-exodus-500/20 focus:border-exodus-500',
              'hover:border-slate-300',
              icon && 'pl-10',
              error && 'border-red-300 focus:ring-red-500/20 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
