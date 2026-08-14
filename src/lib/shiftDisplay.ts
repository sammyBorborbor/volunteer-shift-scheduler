import type { StatusTone } from '../components/StatusPill'

const LOW_CAPACITY_THRESHOLD = 3

export interface CapacityStatus {
  tone: StatusTone
  label: string
}

export function getCapacityStatus(remaining: number): CapacityStatus {
  if (remaining <= 0) {
    return { tone: 'neutral', label: 'Full' }
  }
  if (remaining < LOW_CAPACITY_THRESHOLD) {
    return { tone: 'warning', label: `${remaining} spot${remaining === 1 ? '' : 's'} left` }
  }
  return { tone: 'success', label: `${remaining} spots left` }
}

export type ShiftActionState = 'signed-up' | 'full' | 'open'

export function getShiftActionState(remaining: number, isSignedUp: boolean): ShiftActionState {
  if (isSignedUp) return 'signed-up'
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
