import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { StatusPill } from './StatusPill'
import { useAuth } from '../hooks/useAuth'
import type { UpcomingShift } from '../hooks/useShifts'
import { supabase } from '../lib/supabaseClient'
import type { AttendanceStatus } from '../lib/shiftDisplay'
import {
  formatShiftDate,
  formatShiftTimeRange,
  getAttendanceStatus,
  getCapacityStatus,
  getShiftActionState,
} from '../lib/shiftDisplay'

interface ShiftCardProps {
  shift: UpcomingShift
  myStatus: AttendanceStatus | null
  onChange: () => void
}

export function ShiftCard({ shift, myStatus, onChange }: ShiftCardProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actionState = getShiftActionState(shift.remaining_capacity, myStatus)
  const badge =
    actionState === 'open' || actionState === 'full'
      ? getCapacityStatus(shift.remaining_capacity)
      : actionState === 'confirmed'
        ? { tone: 'success' as const, label: 'Signed up' }
        : actionState === 'completed'
          ? { tone: 'success' as const, label: 'Attended' }
          : getAttendanceStatus('no_show')

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
      onChange()
    }
  }

  async function handleCancel() {
    if (!user) return
    setSubmitting(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('signups')
      .update({ status: 'cancelled' })
      .eq('shift_id', shift.id)
      .eq('volunteer_id', user.id)
    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
    } else {
      onChange()
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

      {actionState === 'confirmed' && (
        <div className="mt-1">
          <Button variant="ghost" size="sm" loading={submitting} onClick={handleCancel}>
            Cancel sign-up
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
