export interface ShiftFormInput {
  title: string
  description?: string
  location?: string
  date: string
  startTime: string
  endTime: string
  capacity: string
}

export interface ShiftFormErrors {
  title?: string
  date?: string
  startTime?: string
  endTime?: string
  capacity?: string
}

function todayAsDateString(now: Date) {
  return now.toISOString().slice(0, 10)
}

export function validateShiftForm(input: ShiftFormInput, now: Date = new Date()): ShiftFormErrors {
  const errors: ShiftFormErrors = {}

  if (!input.title.trim()) {
    errors.title = 'Enter a title for the shift'
  }

  if (!input.date) {
    errors.date = 'Choose a date'
  } else if (input.date < todayAsDateString(now)) {
    errors.date = 'Date can’t be in the past'
  }

  if (!input.startTime) {
    errors.startTime = 'Choose a start time'
  }

  if (!input.endTime) {
    errors.endTime = 'Choose an end time'
  } else if (input.startTime && input.endTime <= input.startTime) {
    errors.endTime = 'End time must be after the start time'
  }

  if (!input.capacity.trim()) {
    errors.capacity = 'Enter a capacity'
  } else {
    const capacityNumber = Number(input.capacity)
    if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
      errors.capacity = 'Capacity must be a whole number greater than 0'
    }
  }

  return errors
}
