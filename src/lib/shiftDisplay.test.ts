import { describe, expect, it } from 'vitest'
import {
  getAttendanceStatus,
  getCapacityStatus,
  getShiftActionState,
  getShiftEditability,
  getSignupHistoryStatus,
  getSignupProgress,
  isUpcoming,
} from './shiftDisplay'

const TODAY = new Date('2026-08-14T12:00:00Z')

describe('getCapacityStatus', () => {
  it('marks a shift with no remaining spots as full', () => {
    const status = getCapacityStatus(0)
    expect(status.tone).toBe('neutral')
    expect(status.label).toBe('Full')
  })

  it('marks a shift with negative remaining spots as full', () => {
    const status = getCapacityStatus(-2)
    expect(status.tone).toBe('neutral')
    expect(status.label).toBe('Full')
  })

  it('warns when only a few spots remain', () => {
    const status = getCapacityStatus(1)
    expect(status.tone).toBe('warning')
    expect(status.label).toBe('1 spot left')
  })

  it('uses plural wording for more than one low spot', () => {
    const status = getCapacityStatus(2)
    expect(status.tone).toBe('warning')
    expect(status.label).toBe('2 spots left')
  })

  it('shows success tone when plenty of spots remain', () => {
    const status = getCapacityStatus(10)
    expect(status.tone).toBe('success')
    expect(status.label).toBe('10 spots left')
  })

  it('treats the low/plenty boundary consistently', () => {
    expect(getCapacityStatus(2).tone).toBe('warning')
    expect(getCapacityStatus(3).tone).toBe('success')
  })
})

describe('getShiftActionState', () => {
  it('is open when spots remain and the volunteer has no relationship to the shift', () => {
    expect(getShiftActionState(5, null)).toBe('open')
  })

  it('is full when no spots remain and the volunteer has no relationship to the shift', () => {
    expect(getShiftActionState(0, null)).toBe('full')
  })

  it('is confirmed when the volunteer is signed up, regardless of spots left', () => {
    expect(getShiftActionState(5, 'confirmed')).toBe('confirmed')
  })

  it('prioritizes confirmed over full when the volunteer took the last spot', () => {
    expect(getShiftActionState(0, 'confirmed')).toBe('confirmed')
  })

  it('is completed when the volunteer already attended, even if the shift is still upcoming', () => {
    expect(getShiftActionState(5, 'completed')).toBe('completed')
  })

  it('is no_show when the volunteer was marked as not attending', () => {
    expect(getShiftActionState(5, 'no_show')).toBe('no_show')
  })
})

describe('getSignupProgress', () => {
  it('flags a shift with zero signups as needing volunteers', () => {
    const progress = getSignupProgress(10, 10)
    expect(progress.tone).toBe('warning')
    expect(progress.label).toBe('0/10 signed up')
  })

  it('flags a shift under half full as needing volunteers', () => {
    const progress = getSignupProgress(10, 6)
    expect(progress.tone).toBe('warning')
    expect(progress.label).toBe('4/10 signed up')
  })

  it('does not flag a shift exactly half full', () => {
    const progress = getSignupProgress(10, 5)
    expect(progress.tone).toBe('success')
    expect(progress.label).toBe('5/10 signed up')
  })

  it('does not flag a shift more than half full', () => {
    const progress = getSignupProgress(10, 4)
    expect(progress.tone).toBe('success')
    expect(progress.label).toBe('6/10 signed up')
  })

  it('does not flag a full shift', () => {
    const progress = getSignupProgress(10, 0)
    expect(progress.tone).toBe('success')
    expect(progress.label).toBe('10/10 signed up')
  })

  it('handles a capacity-of-one shift with no signups', () => {
    const progress = getSignupProgress(1, 1)
    expect(progress.tone).toBe('warning')
    expect(progress.label).toBe('0/1 signed up')
  })
})

describe('getAttendanceStatus', () => {
  it('shows a neutral, pending label for confirmed signups', () => {
    const status = getAttendanceStatus('confirmed')
    expect(status.tone).toBe('neutral')
    expect(status.label).toBe('Awaiting attendance')
  })

  it('shows a success label for completed signups', () => {
    const status = getAttendanceStatus('completed')
    expect(status.tone).toBe('success')
    expect(status.label).toBe('Completed')
  })

  it('shows a destructive label for no-show signups', () => {
    const status = getAttendanceStatus('no_show')
    expect(status.tone).toBe('destructive')
    expect(status.label).toBe('No-show')
  })
})

describe('isUpcoming', () => {
  it('treats a future date as upcoming', () => {
    expect(isUpcoming('2026-08-20', TODAY)).toBe(true)
  })

  it('treats today as upcoming', () => {
    expect(isUpcoming('2026-08-14', TODAY)).toBe(true)
  })

  it('treats a past date as not upcoming', () => {
    expect(isUpcoming('2026-08-01', TODAY)).toBe(false)
  })
})

describe('getSignupHistoryStatus', () => {
  it('shows the same label as getAttendanceStatus for confirmed', () => {
    const status = getSignupHistoryStatus('confirmed')
    expect(status.tone).toBe('neutral')
    expect(status.label).toBe('Awaiting attendance')
  })

  it('shows the same label as getAttendanceStatus for completed', () => {
    const status = getSignupHistoryStatus('completed')
    expect(status.tone).toBe('success')
    expect(status.label).toBe('Completed')
  })

  it('shows the same label as getAttendanceStatus for no_show', () => {
    const status = getSignupHistoryStatus('no_show')
    expect(status.tone).toBe('destructive')
    expect(status.label).toBe('No-show')
  })

  it('shows a distinct neutral label for cancelled', () => {
    const status = getSignupHistoryStatus('cancelled')
    expect(status.tone).toBe('neutral')
    expect(status.label).toBe('Cancelled')
  })

  it('distinguishes a coordinator-cancelled shift from a self-cancelled signup', () => {
    const status = getSignupHistoryStatus('cancelled', true)
    expect(status.tone).toBe('neutral')
    expect(status.label).toBe('Shift cancelled')
  })

  it('does not apply the shift-cancelled label to non-cancelled statuses', () => {
    const status = getSignupHistoryStatus('completed', true)
    expect(status.label).toBe('Completed')
  })
})

describe('getShiftEditability', () => {
  it('allows editing and cancelling an upcoming, non-cancelled shift', () => {
    const result = getShiftEditability('2026-08-20', null, TODAY)
    expect(result.canEdit).toBe(true)
    expect(result.canCancel).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('allows editing a shift happening today', () => {
    const result = getShiftEditability('2026-08-14', null, TODAY)
    expect(result.canEdit).toBe(true)
    expect(result.canCancel).toBe(true)
  })

  it('blocks editing and cancelling a shift that has already been cancelled', () => {
    const result = getShiftEditability('2026-08-20', '2026-08-10T09:00:00Z', TODAY)
    expect(result.canEdit).toBe(false)
    expect(result.canCancel).toBe(false)
    expect(result.reason).toBe('This shift has been cancelled.')
  })

  it('blocks editing and cancelling a shift that already happened', () => {
    const result = getShiftEditability('2026-08-01', null, TODAY)
    expect(result.canEdit).toBe(false)
    expect(result.canCancel).toBe(false)
    expect(result.reason).toBe("Past shifts can't be edited or cancelled.")
  })

  it('prioritizes the cancelled reason over the past-shift reason', () => {
    const result = getShiftEditability('2026-08-01', '2026-08-02T09:00:00Z', TODAY)
    expect(result.reason).toBe('This shift has been cancelled.')
  })
})
