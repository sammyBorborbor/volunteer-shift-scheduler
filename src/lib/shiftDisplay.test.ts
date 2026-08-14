import { describe, expect, it } from 'vitest'
import { getAttendanceStatus, getCapacityStatus, getShiftActionState } from './shiftDisplay'

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
