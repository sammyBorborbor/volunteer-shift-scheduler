import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { StatusPill } from '../components/StatusPill'
import type { StatusTone } from '../components/StatusPill'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type ConnectionStatus = 'checking' | 'connected' | 'error' | 'not-configured'

const statusCopy: Record<ConnectionStatus, { label: string; tone: StatusTone }> = {
  checking: { label: 'Checking…', tone: 'neutral' },
  connected: { label: 'Connected', tone: 'success' },
  error: { label: 'Connection error', tone: 'destructive' },
  'not-configured': { label: 'Not configured', tone: 'warning' },
}

export default function AppHome() {
  const { user } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnectionStatus('not-configured')
      return
    }
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .then(({ error }) => {
        setConnectionStatus(error ? 'error' : 'connected')
      })
  }, [])

  const { label, tone } = statusCopy[connectionStatus]

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-ink">
        Welcome{user?.email ? `, ${user.email}` : ''}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Shift browsing is coming in the next build step — you're signed in and ready.
      </p>
      <p className="mt-6 flex items-center gap-2 text-sm text-muted">
        Supabase connection
        <StatusPill tone={tone}>{label}</StatusPill>
      </p>
    </Layout>
  )
}
