import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusPill } from '../components/StatusPill'
import { useMyShiftHistory } from '../hooks/useMyShiftHistory'
import type { ShiftHistoryEntry } from '../hooks/useMyShiftHistory'
import {
  formatShiftDate,
  formatShiftTimeRange,
  getSignupHistoryStatus,
  isUpcoming,
} from '../lib/shiftDisplay'

function HistoryRow({ entry }: { entry: ShiftHistoryEntry }) {
  const badge = getSignupHistoryStatus(entry.status, Boolean(entry.shift.cancelled_at))
  return (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{entry.shift.title}</p>
          <StatusPill tone={badge.tone}>{badge.label}</StatusPill>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatShiftDate(entry.shift.date)} ·{' '}
          {formatShiftTimeRange(entry.shift.start_time, entry.shift.end_time)}
          {entry.shift.location ? ` · ${entry.shift.location}` : ''}
        </p>
      </div>
    </li>
  )
}

export default function MySignups() {
  const { entries, loading, error } = useMyShiftHistory()

  const upcoming = entries
    .filter((entry) => isUpcoming(entry.shift.date))
    .sort((a, b) => a.shift.date.localeCompare(b.shift.date))
  const past = entries
    .filter((entry) => !isUpcoming(entry.shift.date))
    .sort((a, b) => b.shift.date.localeCompare(a.shift.date))

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-ink">My sign-ups</h2>
      <p className="mt-1 text-sm text-muted">
        Every shift you've signed up for, past and upcoming.
      </p>

      {error && (
        <p role="alert" aria-live="polite" className="mt-6 text-sm text-destructive">
          Couldn't load your sign-ups: {error}
        </p>
      )}

      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          You haven't signed up for any shifts yet.{' '}
          <Link to="/app" className="font-medium text-ink underline underline-offset-2">
            Browse open shifts
          </Link>
          .
        </p>
      )}

      {!loading && !error && upcoming.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-ink">Upcoming ({upcoming.length})</h3>
          <div className="mt-3 rounded-xl border border-border bg-surface-elevated">
            <ul className="divide-y divide-border">
              {upcoming.map((entry) => (
                <HistoryRow key={entry.signupId} entry={entry} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {!loading && !error && past.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-ink">Past ({past.length})</h3>
          <div className="mt-3 rounded-xl border border-border bg-surface-elevated">
            <ul className="divide-y divide-border">
              {past.map((entry) => (
                <HistoryRow key={entry.signupId} entry={entry} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </Layout>
  )
}
