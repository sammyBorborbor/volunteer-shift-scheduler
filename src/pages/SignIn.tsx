import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { FormField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const { profile } = await signIn(email, password)
      navigate(profile?.role === 'coordinator' ? '/coordinator' : '/app', { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout tagline="Every shift you pick up moves your community forward.">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          New here?{' '}
          <Link to="/signup" className="font-medium text-ink underline underline-offset-2">
            Sign up to volunteer
          </Link>
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {formError && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" loading={submitting} className="mt-2">
            Sign in
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
