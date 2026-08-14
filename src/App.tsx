import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { StatusPill } from './components/StatusPill'
import type { StatusTone } from './components/StatusPill'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

type ConnectionStatus = 'checking' | 'connected' | 'error' | 'not-configured'

const statusCopy: Record<ConnectionStatus, { label: string; tone: StatusTone }> = {
  checking: { label: 'Checking…', tone: 'neutral' },
  connected: { label: 'Connected', tone: 'success' },
  error: { label: 'Connection error', tone: 'destructive' },
  'not-configured': { label: 'Not configured', tone: 'warning' },
}

function App() {
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
      <p className="flex items-center gap-2 text-sm text-muted">
        Supabase connection
        <StatusPill tone={tone}>{label}</StatusPill>
      </p>
    </Layout>
  )
}

export default App
