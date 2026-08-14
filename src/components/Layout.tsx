import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

const navLinks = ['Shifts', 'My Sign-ups', 'Create Shift', 'Roster']

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()

  // No explicit redirect here: Layout only ever renders inside ProtectedRoute,
  // whose own auth state reactively redirects to /signin once `user` goes
  // null. An imperative navigate() here would race that guard.
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-ink-foreground">
            Volunteer Shift Scheduler
          </h1>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            {navLinks.map((label) => (
              <a
                key={label}
                href="#"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-ink-foreground/85 transition-colors duration-200 hover:bg-ink-foreground/10 hover:text-ink-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
              >
                {label}
              </a>
            ))}
            {user && (
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-3 text-ink-foreground/85 transition-colors duration-200 hover:bg-ink-foreground/10 hover:text-ink-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
