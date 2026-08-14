import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
}

export function FormField({ label, error, type = 'text', className = '', ...props }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && revealed ? 'text' : type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-11 w-full rounded-lg border bg-surface-elevated px-3 text-sm text-ink placeholder:text-muted focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ink ${
            error ? 'border-destructive' : 'border-border'
          } ${isPassword ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted hover:text-ink"
          >
            {revealed ? (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4.5 w-4.5">
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 3l14 14" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4.5 w-4.5">
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
