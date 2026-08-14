import type { StatusTone } from '../components/StatusPill'

const LOW_CAPACITY_THRESHOLD = 3

export interface StatusBadge {
  tone: StatusTone
  label: string
}

export function getCapacityStatus(remaining: number): StatusBadge {
  if (remaining <= 0) {
    return { tone: 'neutral', label: 'Full' }
  }
  if (remaining < LOW_CAPACITY_THRESHOLD) {
    return { tone: 'warning', label: `${remaining} spot${remaining === 1 ? '' : 's'} left` }
  }
  return { tone: 'success', label: `${remaining} spots left` }
}

export type AttendanceStatus = 'confirmed' | 'completed' | 'no_show'

const attendanceStatusMap: Record<AttendanceStatus, StatusBadge> = {
  confirmed: { tone: 'neutral', label: 'Awaiting attendance' },
  completed: { tone: 'success', label: 'Completed' },
  no_show: { tone: 'destructive', label: 'No-show' },
}

export function getAttendanceStatus(status: AttendanceStatus): StatusBadge {
  return attendanceStatusMap[status]
}

export type ShiftActionState = AttendanceStatus | 'full' | 'open'

// `myStatus` is the volunteer's own signup status for this shift — null if
// they have none (or it's cancelled, which frees them to sign up again).
// A prior status (confirmed/completed/no_show) always wins over capacity,
// since that reflects the volunteer's own history with the shift regardless
// of how many spots are left for other people.
export function getShiftActionState(
  remaining: number,
  myStatus: AttendanceStatus | null,
): ShiftActionState {
  if (myStatus) return myStatus
  if (remaining <= 0) return 'full'
  return 'open'
}

export function formatShiftDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatShiftTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}
