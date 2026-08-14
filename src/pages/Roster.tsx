import { Link, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useRoster } from '../hooks/useRoster'
import { formatShiftDate, formatShiftTimeRange } from '../lib/shiftDisplay'

function formatSignedUpAt(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function Roster() {
  const { shiftId } = useParams<{ shiftId: string }>()
  const { shift, entries, loading, error } = useRoster(shiftId ?? '')

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
            {entries.length} of {shift.capacity} spots confirmed
          </p>

          <div className="mt-6 rounded-xl border border-border bg-surface-elevated">
            {entries.length === 0 ? (
              <p className="p-5 text-sm text-muted">No one has signed up for this shift yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {entries.map((entry) => (
                  <li
                    key={entry.signupId}
                    className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{entry.fullName}</p>
                      {entry.phone && <p className="text-sm text-muted">{entry.phone}</p>}
                    </div>
                    <p className="text-sm text-muted">
                      Signed up {formatSignedUpAt(entry.signedUpAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
