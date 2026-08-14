import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
  tagline: string
}

// Split-screen shell for the pre-auth pages (SignIn/SignUp). These render
// outside the authenticated Layout (no session yet), so without this they
// were just a small centered card on an otherwise bare page — the same
// "empty sides" problem the dashboards had, minus even a header bar to
// anchor it. Reuses the landing page's own verified hero photo rather than
// sourcing a fourth one: landing (brand register, full hero) -> auth
// (product register, smaller split panel of the same image) -> dashboard
// (a different, role-specific photo once you're actually signed in) reads
// as a deliberate visual thread through the app, not three unrelated
// images. Photo panel is desktop-only (`lg:block`) — collapsing it on
// mobile keeps the form above the fold instead of pushing it down.
export function AuthLayout({ children, tagline }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <div className="relative hidden w-2/5 shrink-0 overflow-hidden bg-ink lg:block">
        <img
          src="https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=1200&q=80"
          alt="Volunteers sorting food donations at a community distribution center"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/55 to-ink/20" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link
            to="/"
            className="w-fit rounded-md text-lg font-semibold text-ink-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Volunteer Shift Scheduler
          </Link>
          <p className="max-w-sm text-balance text-2xl font-semibold text-ink-foreground">
            {tagline}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 py-8 sm:px-6">
        <Link
          to="/"
          className="w-fit rounded-md text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
        >
          Volunteer Shift Scheduler
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
