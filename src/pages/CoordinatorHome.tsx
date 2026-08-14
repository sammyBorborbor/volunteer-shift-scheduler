import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CoordinatorShiftRow } from '../components/CoordinatorShiftRow'
import { DashboardHero } from '../components/DashboardHero'
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
    <Layout
      banner={
        <DashboardHero
          imageUrl="https://images.unsplash.com/photo-1758599668125-e154250f24bd?auto=format&fit=crop&w=1600&q=80"
          imageAlt="A coordinator in gloves writing on a clipboard with volunteers working in the background."
          title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
          subtitle="Keep shifts staffed and volunteers in the loop."
        />
      }
    >
      <p className="text-sm text-muted">
        Create shifts for volunteers to sign up for, then use each shift's roster to see who's
        signed up and mark attendance once it's happened.
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
        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-elevated px-6 py-10 text-center">
          <p className="text-sm font-medium text-ink">No upcoming shifts yet</p>
          <p className="mt-1 text-sm text-muted">Create one above to get started.</p>
        </div>
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
