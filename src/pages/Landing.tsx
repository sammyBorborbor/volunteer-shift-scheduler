import { Link } from 'react-router-dom'
import { Button } from '../components/Button'

const steps = [
  {
    title: 'Browse open shifts',
    body: 'See what’s open, when, and where — no group chat archaeology required.',
  },
  {
    title: 'Sign up in one tap',
    body: 'Capacity and schedule conflicts are checked automatically, so you never double-book.',
  },
  {
    title: 'Show up, get credit',
    body: 'Coordinators mark attendance directly, so your hours are tracked without extra paperwork.',
  },
]

export default function Landing() {
  return (
    <div className="bg-surface text-ink">
      <section className="bg-ink">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <span className="font-display text-base font-semibold text-ink-foreground sm:text-lg">
            Volunteer Shift Scheduler
          </span>
          <nav className="flex items-center gap-2">
            <Link
              to="/signin"
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium text-ink-foreground/85 transition-colors duration-200 hover:bg-ink-foreground/10 hover:text-ink-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Sign in
            </Link>
            <Link to="/signup">
              <Button variant="secondary" size="sm">
                Sign up
              </Button>
            </Link>
          </nav>
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="animate-fade-up">
            <h1 className="text-balance font-display text-4xl font-semibold leading-tight tracking-tight text-ink-foreground sm:text-5xl lg:text-6xl">
              Volunteering, organized.
            </h1>
            <p className="mt-5 max-w-md text-pretty text-lg text-ink-foreground/80">
              See open shifts, sign up in one tap, and never worry about double-booking. Built
              for community organizations that need less admin and more hands on deck.
            </p>
            <div
              className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:120ms]"
            >
              <Link to="/signup">
                <Button variant="secondary" size="lg">
                  Sign up to volunteer
                </Button>
              </Link>
              <Link
                to="/signin"
                className="inline-flex min-h-12 cursor-pointer items-center rounded-lg px-6 text-base font-medium text-ink-foreground transition-colors duration-200 hover:bg-ink-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="animate-fade-up overflow-hidden rounded-2xl [animation-delay:80ms]">
            <img
              src="https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=1600&q=80"
              alt="Volunteers sorting food donations at a community distribution center"
              className="h-full w-full object-cover"
              width={1600}
              height={1200}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col gap-2">
              <span className="font-display text-3xl font-semibold text-accent-foreground/40">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="text-lg font-semibold text-ink">{step.title}</h2>
              <p className="text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display text-2xl font-semibold text-ink-foreground sm:text-3xl">
            Ready to sign up for your first shift?
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="lg">
              Get started
            </Button>
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted sm:px-6">
        Volunteer Shift Scheduler
      </footer>
    </div>
  )
}
