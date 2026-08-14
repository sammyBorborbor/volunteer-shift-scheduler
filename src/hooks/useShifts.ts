import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface UpcomingShift {
  id: string
  title: string
  description: string | null
  location: string | null
  date: string
  start_time: string
  end_time: string
  capacity: number
  remaining_capacity: number
  created_by: string
}

export function useShifts() {
  const [shifts, setShifts] = useState<UpcomingShift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .rpc('get_upcoming_shifts_with_capacity')
      .then(({ data, error: rpcError }) => {
        if (cancelled) return
        if (rpcError) {
          setError(rpcError.message)
        } else {
          setShifts(data ?? [])
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { shifts, loading, error }
}
