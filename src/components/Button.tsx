import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'lg' | 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-ink-foreground hover:bg-ink/90 focus-visible:outline-accent',
  secondary:
    'bg-accent text-accent-foreground hover:bg-accent/85 focus-visible:outline-ink',
  ghost:
    'bg-transparent text-ink hover:bg-ink/5 focus-visible:outline-ink',
  destructive:
    'bg-destructive text-white hover:bg-destructive/90 focus-visible:outline-destructive',
}

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'min-h-12 px-6 text-base',
  md: 'min-h-11 px-4 text-sm',
  sm: 'min-h-11 px-3 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
