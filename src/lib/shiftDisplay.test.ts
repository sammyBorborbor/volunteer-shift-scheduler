import { describe, expect, it } from 'vitest'
import { getCapacityStatus } from './shiftDisplay'

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
