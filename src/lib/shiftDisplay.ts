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

const UNDER_CAPACITY_THRESHOLD = 0.5

// Coordinator-facing signal (FR-11): the volunteer-facing "spots left" framing
// is the wrong metric here — a shift with 1 spot left out of 10 reads as
// "urgent" to a volunteer but is actually a well-subscribed, healthy shift
// from the coordinator's side. This flags the opposite condition: too few
// people signed up relative to capacity, which is what a coordinator needs
// to notice and act on (promote the shift, recruit more volunteers).
export function getSignupProgress(capacity: number, remaining: number): StatusBadge {
  const confirmed = capacity - remaining
  const fillRate = capacity > 0 ? confirmed / capacity : 1
  const label = `${confirmed}/${capacity} signed up`
  return fillRate < UNDER_CAPACITY_THRESHOLD
    ? { tone: 'warning', label }
    : { tone: 'success', label }
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

export type SignupHistoryStatus = AttendanceStatus | 'cancelled'

// A volunteer's own history (FR-09) needs 'cancelled' as a real, visible
// state — unlike everywhere else in the app, where cancelled is deliberately
// excluded because it means "free to sign up again." Kept as a separate type
// from AttendanceStatus rather than widening that one, since every other
// caller (useMySignups, useRoster, ShiftCard, RosterEntryRow) intentionally
// never sees 'cancelled' and shouldn't have to handle it.
// `shiftCancelled` distinguishes a coordinator cancelling the whole shift
// (which cascades every confirmed signup to 'cancelled', FR-10) from a
// volunteer cancelling their own signup — the same underlying status, but a
// volunteer shouldn't have to wonder whether they did this themselves.
export function getSignupHistoryStatus(
  status: SignupHistoryStatus,
  shiftCancelled = false,
): StatusBadge {
  if (status === 'cancelled') {
    return shiftCancelled
      ? { tone: 'neutral', label: 'Shift cancelled' }
      : { tone: 'neutral', label: 'Cancelled' }
  }
  return getAttendanceStatus(status)
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

// Same "today counts as upcoming" convention as shiftValidation's date rule —
// a shift happening later today isn't past yet.
export function isUpcoming(date: string, now: Date = new Date()): boolean {
  const today = now.toISOString().slice(0, 10)
  return date >= today
}

export interface ShiftEditability {
  canEdit: boolean
  canCancel: boolean
  reason?: string
}

// FR-10: a coordinator can edit/cancel a shift only while it's both upcoming
// and not already cancelled. Cancelled wins over past-dated when a shift is
// somehow both (cancelling doesn't move the date), since "already cancelled"
// is the more specific, more useful thing to tell the coordinator.
export function getShiftEditability(
  date: string,
  cancelledAt: string | null,
  now: Date = new Date(),
): ShiftEditability {
  if (cancelledAt) {
    return { canEdit: false, canCancel: false, reason: 'This shift has been cancelled.' }
  }
  if (!isUpcoming(date, now)) {
    return { canEdit: false, canCancel: false, reason: "Past shifts can't be edited or cancelled." }
  }
  return { canEdit: true, canCancel: true }
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
