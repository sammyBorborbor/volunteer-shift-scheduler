import { describe, expect, it } from 'vitest'
import { getCapacityStatus, getShiftActionState } from './shiftDisplay'

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
  it('is open when spots remain and the volunteer has not signed up', () => {
    expect(getShiftActionState(5, false)).toBe('open')
  })

  it('is full when no spots remain and the volunteer has not signed up', () => {
    expect(getShiftActionState(0, false)).toBe('full')
  })

  it('is signed-up when the volunteer has already signed up, regardless of spots left', () => {
    expect(getShiftActionState(5, true)).toBe('signed-up')
  })

  it('prioritizes signed-up over full when the volunteer took the last spot', () => {
    expect(getShiftActionState(0, true)).toBe('signed-up')
  })
})
