import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'

export default function CoordinatorHome() {
  const { profile } = useAuth()

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-ink">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Create shifts for volunteers to sign up for. Roster management and attendance are
        coming in a later build step.
      </p>

      <Card className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Post a new shift</h3>
          <p className="mt-1 text-sm text-muted">
            Set the date, time, and capacity — volunteers will see it once it's live.
          </p>
        </div>
        <Link to="/coordinator/create-shift">
          <Button variant="primary">Create shift</Button>
        </Link>
      </Card>
    </Layout>
  )
}
