import { Link, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RosterEntryRow } from '../components/RosterEntryRow'
import { useRoster } from '../hooks/useRoster'
import { formatShiftDate, formatShiftTimeRange } from '../lib/shiftDisplay'

export default function Roster() {
  const { shiftId } = useParams<{ shiftId: string }>()
  const { shift, entries, loading, error, refetch } = useRoster(shiftId ?? '')

  const pending = entries.filter((entry) => entry.status === 'confirmed')
  const recorded = entries.filter((entry) => entry.status !== 'confirmed')

  return (
    <Layout>
      <Link to="/coordinator" className="text-sm font-medium text-ink underline underline-offset-2">
        ← Back to your shifts
      </Link>

      {loading && <p className="mt-6 text-sm text-muted">Loading roster…</p>}

      {!loading && error && (
        <p role="alert" aria-live="polite" className="mt-6 text-sm text-destructive">
          {error === 'Shift not found' ? error : `Couldn't load this roster: ${error}`}
        </p>
      )}

      {!loading && !error && shift && (
        <>
          <h2 className="mt-4 text-lg font-semibold text-ink">{shift.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {formatShiftDate(shift.date)} · {formatShiftTimeRange(shift.start_time, shift.end_time)}
            {shift.location ? ` · ${shift.location}` : ''}
          </p>
          <p className="mt-1 text-sm text-muted">
            {entries.length} of {shift.capacity} spots signed up
          </p>

          {entries.length === 0 && (
            <div className="mt-6 rounded-xl border border-border bg-surface-elevated">
              <p className="p-5 text-sm text-muted">No one has signed up for this shift yet.</p>
            </div>
          )}

          {pending.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-ink">
                Awaiting attendance ({pending.length})
              </h3>
              <div className="mt-3 rounded-xl border border-border bg-surface-elevated">
                <ul className="divide-y divide-border">
                  {pending.map((entry) => (
                    <RosterEntryRow key={entry.signupId} entry={entry} onChange={refetch} />
                  ))}
                </ul>
              </div>
            </section>
          )}

          {recorded.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-ink">Recorded ({recorded.length})</h3>
              <div className="mt-3 rounded-xl border border-border bg-surface-elevated">
                <ul className="divide-y divide-border">
                  {recorded.map((entry) => (
                    <RosterEntryRow key={entry.signupId} entry={entry} onChange={refetch} />
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </Layout>
  )
}
