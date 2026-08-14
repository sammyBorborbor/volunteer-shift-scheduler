import { Link } from 'react-router-dom'
import { Button } from './Button'
import { Card } from './Card'
import { StatusPill } from './StatusPill'
import type { UpcomingShift } from '../hooks/useShifts'
import { formatShiftDate, formatShiftTimeRange, getSignupProgress } from '../lib/shiftDisplay'

interface CoordinatorShiftRowProps {
  shift: UpcomingShift
}

export function CoordinatorShiftRow({ shift }: CoordinatorShiftRowProps) {
  const status = getSignupProgress(shift.capacity, shift.remaining_capacity)

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{shift.title}</h3>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatShiftDate(shift.date)} · {formatShiftTimeRange(shift.start_time, shift.end_time)}
          {shift.location ? ` · ${shift.location}` : ''}
        </p>
      </div>
      <Link to={`/coordinator/shifts/${shift.id}/roster`} className="shrink-0">
        <Button variant="ghost" size="sm">
          View roster
        </Button>
      </Link>
    </Card>
  )
}
