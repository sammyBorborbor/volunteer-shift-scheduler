import { DashboardHero } from '../components/DashboardHero'
import { Layout } from '../components/Layout'
import { ShiftCard } from '../components/ShiftCard'
import { useAuth } from '../hooks/useAuth'
import { useMySignups } from '../hooks/useMySignups'
import { useShifts } from '../hooks/useShifts'

function ShiftCardSkeleton() {
  return (
    <div className="h-32 animate-pulse rounded-xl border border-border bg-surface-elevated" />
  )
}

export default function AppHome() {
  const { profile } = useAuth()
  const { shifts, loading: shiftsLoading, error, refetch: refetchShifts } = useShifts()
  const { myStatusByShiftId, loading: signupsLoading, refetch: refetchSignups } = useMySignups()

  const loading = shiftsLoading || signupsLoading

  function handleChange() {
    refetchShifts()
    refetchSignups()
  }

  return (
    <Layout
      banner={
        <DashboardHero
          imageUrl="https://images.unsplash.com/photo-1758599668294-8d13c0942601?auto=format&fit=crop&w=1600&q=80"
          imageAlt="A volunteer smiling while picking up litter in a park with a group of fellow volunteers."
          title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
          subtitle="Every shift you pick up moves your community forward. Find one below."
        />
      }
    >
      <h2 className="text-lg font-semibold text-ink">Upcoming shifts</h2>
      <p className="mt-1 text-sm text-muted">
        Sign up for a shift below — capacity updates as volunteers join.
      </p>

      {error && (
        <p role="alert" aria-live="polite" className="mt-6 text-sm text-destructive">
          Couldn't load shifts: {error}
        </p>
      )}

      {loading && (
        <div
          className="mt-6 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          <ShiftCardSkeleton />
          <ShiftCardSkeleton />
          <ShiftCardSkeleton />
        </div>
      )}

      {!loading && !error && shifts.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface-elevated px-6 py-10 text-center">
          <p className="text-sm font-medium text-ink">No upcoming shifts yet</p>
          <p className="mt-1 text-sm text-muted">
            Check back soon, or ask your coordinator when the next one's going up.
          </p>
        </div>
      )}

      {!loading && !error && shifts.length > 0 && (
        <div
          className="mt-6 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              myStatus={myStatusByShiftId.get(shift.id) ?? null}
              onChange={handleChange}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}
