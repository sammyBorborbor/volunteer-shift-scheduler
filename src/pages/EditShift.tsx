import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import { ShiftFormFields } from '../components/ShiftFormFields'
import { useShift } from '../hooks/useShift'
import { supabase } from '../lib/supabaseClient'
import { getShiftEditability } from '../lib/shiftDisplay'
import { validateShiftForm } from '../lib/shiftValidation'
import type { ShiftFormErrors, ShiftFormInput } from '../lib/shiftValidation'

export default function EditShift() {
  const { shiftId } = useParams<{ shiftId: string }>()
  const navigate = useNavigate()
  const { shift, loading, error } = useShift(shiftId ?? '')

  const [form, setForm] = useState<ShiftFormInput | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ShiftFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!shift) return
    setForm({
      title: shift.title,
      description: shift.description ?? '',
      location: shift.location ?? '',
      date: shift.date,
      startTime: shift.start_time.slice(0, 5),
      endTime: shift.end_time.slice(0, 5),
      capacity: String(shift.capacity),
    })
  }, [shift])

  function updateField<K extends keyof ShiftFormInput>(field: K, value: ShiftFormInput[K]) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  function handleBlur(field: keyof ShiftFormErrors) {
    if (!form) return
    const errors = validateShiftForm(form)
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form || !shiftId) return
    setFormError(null)

    const errors = validateShiftForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    const { error: updateError } = await supabase
      .from('shifts')
      .update({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        location: form.location?.trim() || null,
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        capacity: Number(form.capacity),
      })
      .eq('id', shiftId)
    if (updateError) {
      setFormError(updateError.message)
      setSubmitting(false)
    } else {
      navigate('/coordinator')
    }
  }

  return (
    <Layout>
      <Link to="/coordinator" className="text-sm font-medium text-ink underline underline-offset-2">
        ← Back to your shifts
      </Link>

      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!loading && error && (
        <p role="alert" aria-live="polite" className="mt-6 text-sm text-destructive">
          {error === 'Shift not found' ? error : `Couldn't load this shift: ${error}`}
        </p>
      )}

      {!loading && !error && shift && form && (
        <>
          <h2 className="mt-4 text-lg font-semibold text-ink">Edit shift</h2>

          {(() => {
            const editability = getShiftEditability(shift.date, shift.cancelled_at)
            if (!editability.canEdit) {
              return (
                <p className="mt-2 text-sm text-muted" role="status">
                  {editability.reason}
                </p>
              )
            }
            return (
              <Card className="mt-6 max-w-xl">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
                  <ShiftFormFields
                    form={form}
                    fieldErrors={fieldErrors}
                    updateField={updateField}
                    handleBlur={handleBlur}
                  />

                  {formError && (
                    <p role="alert" aria-live="polite" className="text-sm text-destructive">
                      {formError}
                    </p>
                  )}

                  <div className="mt-2 flex gap-3">
                    <Button type="submit" variant="primary" loading={submitting}>
                      Save changes
                    </Button>
                    <Link to="/coordinator">
                      <Button variant="ghost">Cancel</Button>
                    </Link>
                  </div>
                </form>
              </Card>
            )
          })()}
        </>
      )}
    </Layout>
  )
}
