import { Layout } from '../components/Layout'
import { ShiftCard } from '../components/ShiftCard'
import { useMySignups } from '../hooks/useMySignups'
import { useShifts } from '../hooks/useShifts'

function ShiftCardSkeleton() {
  return (
    <div className="h-32 animate-pulse rounded-xl border border-border bg-surface-elevated" />
  )
}

export default function AppHome() {
  const { shifts, loading: shiftsLoading, error, refetch: refetchShifts } = useShifts()
  const { signedUpShiftIds, loading: signupsLoading, refetch: refetchSignups } = useMySignups()

  const loading = shiftsLoading || signupsLoading

  function handleChange() {
    refetchShifts()
    refetchSignups()
  }

  return (
    <Layout>
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
        <p className="mt-6 text-sm text-muted">
          No upcoming shifts yet — check back soon, or ask your coordinator when the next one's
          going up.
        </p>
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
              isSignedUp={signedUpShiftIds.has(shift.id)}
              onChange={handleChange}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}
