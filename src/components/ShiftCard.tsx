import { Card } from './Card'
import { StatusPill } from './StatusPill'
import type { UpcomingShift } from '../hooks/useShifts'
import { formatShiftDate, formatShiftTimeRange, getCapacityStatus } from '../lib/shiftDisplay'

interface ShiftCardProps {
  shift: UpcomingShift
}

export function ShiftCard({ shift }: ShiftCardProps) {
  const status = getCapacityStatus(shift.remaining_capacity)

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{shift.title}</h3>
        <StatusPill tone={status.tone} className="shrink-0">
          {status.label}
        </StatusPill>
      </div>

      <p className="text-sm text-muted">
        {formatShiftDate(shift.date)} · {formatShiftTimeRange(shift.start_time, shift.end_time)}
      </p>

      {shift.location && <p className="text-sm text-muted">{shift.location}</p>}

      {shift.description && <p className="text-sm text-ink/80">{shift.description}</p>}
    </Card>
  )
}
