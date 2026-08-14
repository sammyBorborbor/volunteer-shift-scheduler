import { FormField } from './FormField'
import type { ShiftFormErrors, ShiftFormInput } from '../lib/shiftValidation'

interface ShiftFormFieldsProps {
  form: ShiftFormInput
  fieldErrors: ShiftFormErrors
  updateField: <K extends keyof ShiftFormInput>(field: K, value: ShiftFormInput[K]) => void
  handleBlur: (field: keyof ShiftFormErrors) => void
}

export function ShiftFormFields({ form, fieldErrors, updateField, handleBlur }: ShiftFormFieldsProps) {
  return (
    <>
      <FormField
        label="Title"
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        onBlur={() => handleBlur('title')}
        error={fieldErrors.title}
      />
      <FormField
        label="Description (optional)"
        value={form.description}
        onChange={(e) => updateField('description', e.target.value)}
      />
      <FormField
        label="Location (optional)"
        value={form.location}
        onChange={(e) => updateField('location', e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => updateField('date', e.target.value)}
          onBlur={() => handleBlur('date')}
          error={fieldErrors.date}
        />
        <FormField
          label="Start time"
          type="time"
          value={form.startTime}
          onChange={(e) => updateField('startTime', e.target.value)}
          onBlur={() => handleBlur('startTime')}
          error={fieldErrors.startTime}
        />
        <FormField
          label="End time"
          type="time"
          value={form.endTime}
          onChange={(e) => updateField('endTime', e.target.value)}
          onBlur={() => handleBlur('endTime')}
          error={fieldErrors.endTime}
        />
      </div>

      <FormField
        label="Capacity"
        type="number"
        min={1}
        value={form.capacity}
        onChange={(e) => updateField('capacity', e.target.value)}
        onBlur={() => handleBlur('capacity')}
        error={fieldErrors.capacity}
      />
    </>
  )
}
