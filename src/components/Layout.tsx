import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

const volunteerLinks = [
  { label: 'Shifts', to: '/app' },
  { label: 'My Sign-ups', to: '#' },
]

const coordinatorLinks = [
  { label: 'Create Shift', to: '/coordinator/create-shift' },
  { label: 'Roster', to: '#' },
]

const navLinkClasses =
  'inline-flex min-h-11 items-center rounded-md px-3 text-ink-foreground/85 transition-colors duration-200 hover:bg-ink-foreground/10 hover:text-ink-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none'

export function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuth()

  const homeTo = profile?.role === 'coordinator' ? '/coordinator' : '/app'
  const links = profile?.role === 'coordinator' ? coordinatorLinks : volunteerLinks

  // No explicit redirect here: Layout only ever renders inside ProtectedRoute,
  // whose own auth state reactively redirects to /signin once `user` goes
  // null. An imperative navigate() here would race that guard.
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={homeTo}
            className="rounded-md text-lg font-semibold text-ink-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Volunteer Shift Scheduler
          </Link>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            {links.map((link) =>
              link.to === '#' ? (
                <a key={link.label} href="#" className={navLinkClasses}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.to} className={navLinkClasses}>
                  {link.label}
                </Link>
              ),
            )}
            {user && (
              <button type="button" onClick={() => signOut()} className={`cursor-pointer ${navLinkClasses}`}>
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
