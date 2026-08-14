import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CoordinatorShiftRow } from '../components/CoordinatorShiftRow'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useShifts } from '../hooks/useShifts'

function ShiftRowSkeleton() {
  return <div className="h-20 animate-pulse rounded-xl border border-border bg-surface-elevated" />
}

export default function CoordinatorHome() {
  const { profile } = useAuth()
  const { shifts, loading, error } = useShifts()

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-ink">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Create shifts for volunteers to sign up for, and view who's signed up for each one.
        Marking attendance is coming in a later build step.
      </p>

      <Card className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Post a new shift</h3>
          <p className="mt-1 text-sm text-muted">
            Set the date, time, and capacity — volunteers will see it once it's live.
          </p>
        </div>
        <Link to="/coordinator/create-shift">
          <Button variant="primary">Create shift</Button>
        </Link>
      </Card>

      <h3 className="mt-10 text-sm font-semibold text-ink">Your shifts</h3>

      {error && (
        <p role="alert" aria-live="polite" className="mt-4 text-sm text-destructive">
          Couldn't load shifts: {error}
        </p>
      )}

      {loading && (
        <div className="mt-4 flex flex-col gap-3">
          <ShiftRowSkeleton />
          <ShiftRowSkeleton />
        </div>
      )}

      {!loading && !error && shifts.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No upcoming shifts yet — create one above to get started.
        </p>
      )}

      {!loading && !error && shifts.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {shifts.map((shift) => (
            <CoordinatorShiftRow key={shift.id} shift={shift} />
          ))}
        </div>
      )}
    </Layout>
  )
}
