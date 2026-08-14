import { describe, expect, it } from 'vitest'
import { validateShiftForm } from './shiftValidation'
import type { ShiftFormInput } from './shiftValidation'

const NOW = new Date('2026-08-14T12:00:00Z')

function validInput(overrides: Partial<ShiftFormInput> = {}): ShiftFormInput {
  return {
    title: 'Food bank sorting',
    description: '',
    location: 'Community Center',
    date: '2026-08-20',
    startTime: '09:00',
    endTime: '12:00',
    capacity: '10',
    ...overrides,
  }
}

describe('validateShiftForm', () => {
  it('accepts valid input with no errors', () => {
    expect(validateShiftForm(validInput(), NOW)).toEqual({})
  })

  it('requires a title', () => {
    const errors = validateShiftForm(validInput({ title: '' }), NOW)
    expect(errors.title).toBeDefined()
  })

  it('rejects a title that is only whitespace', () => {
    const errors = validateShiftForm(validInput({ title: '   ' }), NOW)
    expect(errors.title).toBeDefined()
  })

  it('rejects a date in the past', () => {
    const errors = validateShiftForm(validInput({ date: '2026-08-01' }), NOW)
    expect(errors.date).toBeDefined()
  })

  it('accepts today as a valid date', () => {
    const errors = validateShiftForm(validInput({ date: '2026-08-14' }), NOW)
    expect(errors.date).toBeUndefined()
  })

  it('requires a date', () => {
    const errors = validateShiftForm(validInput({ date: '' }), NOW)
    expect(errors.date).toBeDefined()
  })

  it('rejects start time equal to end time', () => {
    const errors = validateShiftForm(
      validInput({ startTime: '09:00', endTime: '09:00' }),
      NOW,
    )
    expect(errors.endTime).toBeDefined()
  })

  it('rejects start time after end time', () => {
    const errors = validateShiftForm(
      validInput({ startTime: '13:00', endTime: '09:00' }),
      NOW,
    )
    expect(errors.endTime).toBeDefined()
  })

  it('accepts start time before end time', () => {
    const errors = validateShiftForm(
      validInput({ startTime: '09:00', endTime: '12:00' }),
      NOW,
    )
    expect(errors.endTime).toBeUndefined()
  })

  it('rejects a capacity of zero', () => {
    const errors = validateShiftForm(validInput({ capacity: '0' }), NOW)
    expect(errors.capacity).toBeDefined()
  })

  it('rejects a negative capacity', () => {
    const errors = validateShiftForm(validInput({ capacity: '-5' }), NOW)
    expect(errors.capacity).toBeDefined()
  })

  it('rejects a non-numeric capacity', () => {
    const errors = validateShiftForm(validInput({ capacity: 'abc' }), NOW)
    expect(errors.capacity).toBeDefined()
  })

  it('rejects a non-integer capacity', () => {
    const errors = validateShiftForm(validInput({ capacity: '3.5' }), NOW)
    expect(errors.capacity).toBeDefined()
  })

  it('accepts a valid positive integer capacity', () => {
    const errors = validateShiftForm(validInput({ capacity: '25' }), NOW)
    expect(errors.capacity).toBeUndefined()
  })
})
