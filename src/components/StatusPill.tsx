import type { HTMLAttributes } from 'react'

export type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral'

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  destructive: 'bg-destructive-bg text-destructive',
  neutral: 'bg-neutral-bg text-neutral',
}

export function StatusPill({ tone, className = '', children, ...props }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
