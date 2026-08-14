import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { FormField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'

interface FieldErrors {
  fullName?: string
  email?: string
  password?: string
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  function validateField(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (field === 'fullName') {
        if (!fullName.trim()) next.fullName = 'Enter your full name'
        else delete next.fullName
      }
      if (field === 'email') {
        if (!isValidEmail(email)) next.email = 'Enter a valid email address'
        else delete next.email
      }
      if (field === 'password') {
        if (password.length < 8) next.password = 'Use at least 8 characters'
        else delete next.password
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const errors: FieldErrors = {}
    if (!fullName.trim()) errors.fullName = 'Enter your full name'
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address'
    if (password.length < 8) errors.password = 'Use at least 8 characters'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const data = await signUp({ email, password, fullName })
      if (data.session) {
        navigate('/app', { replace: true })
      } else {
        setCheckEmail(true)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <Card className="w-full max-w-sm text-center">
          <h1 className="text-lg font-semibold text-ink">Check your email</h1>
          <p className="mt-2 text-sm text-muted">
            We sent a confirmation link to <span className="font-medium text-ink">{email}</span>.
            Follow it to activate your account, then sign in.
          </p>
          <Link to="/signin" className="mt-6 inline-block">
            <Button variant="primary">Go to sign in</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-ink">Sign up to volunteer</h1>
        <p className="mt-1 text-sm text-muted">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-ink underline underline-offset-2">
            Sign in
          </Link>
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Full name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => validateField('fullName')}
            error={fieldErrors.fullName}
          />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateField('email')}
            error={fieldErrors.email}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => validateField('password')}
            error={fieldErrors.password}
          />

          {formError && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" loading={submitting} className="mt-2">
            Create account
          </Button>
        </form>
      </Card>
    </div>
  )
}
