import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { FormField } from '../components/FormField'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { validateShiftForm } from '../lib/shiftValidation'
import type { ShiftFormErrors, ShiftFormInput } from '../lib/shiftValidation'

const emptyForm: ShiftFormInput = {
  title: '',
  description: '',
  location: '',
  date: '',
  startTime: '',
  endTime: '',
  capacity: '',
}

export default function CreateShift() {
  const { user } = useAuth()

  const [form, setForm] = useState<ShiftFormInput>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<ShiftFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ title: string; date: string } | null>(null)

  function updateField<K extends keyof ShiftFormInput>(field: K, value: ShiftFormInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleBlur(field: keyof ShiftFormErrors) {
    const errors = validateShiftForm(form)
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const errors = validateShiftForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (!user) {
      setFormError('Your session expired — sign in again.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('shifts').insert({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        location: form.location?.trim() || null,
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        capacity: Number(form.capacity),
        created_by: user.id,
      })
      if (error) throw error
      setCreated({ title: form.title.trim(), date: form.date })
      setForm(emptyForm)
      setFieldErrors({})
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <Layout>
        <Card className="max-w-md">
          <h2 className="text-lg font-semibold text-ink">Shift created</h2>
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-ink">{created.title}</span> is live for{' '}
            {created.date}. Volunteers will be able to sign up for it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setCreated(null)}>
              Create another shift
            </Button>
            <Link to="/coordinator">
              <Button variant="ghost">Back to dashboard</Button>
            </Link>
          </div>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-ink">Create a shift</h2>
      <p className="mt-1 text-sm text-muted">
        Volunteers will see this shift as soon as it's created.
      </p>

      <Card className="mt-6 max-w-xl">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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

          {formError && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" variant="primary" loading={submitting}>
              Create shift
            </Button>
            <Link to="/coordinator">
              <Button variant="ghost">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </Layout>
  )
}
