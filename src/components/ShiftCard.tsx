import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { StatusPill } from './StatusPill'
import type { UpcomingShift } from '../hooks/useShifts'
import { supabase } from '../lib/supabaseClient'
import {
  formatShiftDate,
  formatShiftTimeRange,
  getCapacityStatus,
  getShiftActionState,
} from '../lib/shiftDisplay'

interface ShiftCardProps {
  shift: UpcomingShift
  isSignedUp: boolean
  onSignedUp: () => void
}

export function ShiftCard({ shift, isSignedUp, onSignedUp }: ShiftCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actionState = getShiftActionState(shift.remaining_capacity, isSignedUp)
  const badge =
    actionState === 'signed-up'
      ? { tone: 'success' as const, label: 'Signed up' }
      : getCapacityStatus(shift.remaining_capacity)

  async function handleSignUp() {
    setSubmitting(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('sign_up_for_shift', {
      p_shift_id: shift.id,
    })
    if (rpcError) {
      setError(rpcError.message)
      setSubmitting(false)
    } else {
      onSignedUp()
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{shift.title}</h3>
        <StatusPill tone={badge.tone} className="shrink-0">
          {badge.label}
        </StatusPill>
      </div>

      <p className="text-sm text-muted">
        {formatShiftDate(shift.date)} · {formatShiftTimeRange(shift.start_time, shift.end_time)}
      </p>

      {shift.location && <p className="text-sm text-muted">{shift.location}</p>}

      {shift.description && <p className="text-sm text-ink/80">{shift.description}</p>}

      {actionState === 'open' && (
        <div className="mt-1">
          <Button variant="primary" size="sm" loading={submitting} onClick={handleSignUp}>
            Sign up
          </Button>
          {error && (
            <p role="alert" aria-live="polite" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
