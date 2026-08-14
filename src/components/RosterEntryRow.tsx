import { useState } from 'react'
import { Button } from './Button'
import { StatusPill } from './StatusPill'
import type { RosterEntry } from '../hooks/useRoster'
import { supabase } from '../lib/supabaseClient'
import { getAttendanceStatus } from '../lib/shiftDisplay'

interface RosterEntryRowProps {
  entry: RosterEntry
  onChange: () => void
}

function formatSignedUpAt(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function RosterEntryRow({ entry, onChange }: RosterEntryRowProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMark(status: 'completed' | 'no_show') {
    setSubmitting(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('signups')
      .update({ status })
      .eq('id', entry.signupId)
    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
    } else {
      onChange()
    }
  }

  const badge = getAttendanceStatus(entry.status)
  const meta = [entry.phone, `Signed up ${formatSignedUpAt(entry.signedUpAt)}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{entry.fullName}</p>
          <StatusPill tone={badge.tone}>{badge.label}</StatusPill>
        </div>
        <p className="mt-1 text-sm text-muted">{meta}</p>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={submitting}
            disabled={entry.status === 'completed'}
            onClick={() => handleMark('completed')}
          >
            Mark completed
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={submitting}
            disabled={entry.status === 'no_show'}
            onClick={() => handleMark('no_show')}
          >
            Mark no-show
          </Button>
        </div>
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </li>
  )
}
