import { useCallback, useEffect, useRef, useState } from 'react'
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
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('get_upcoming_shifts_with_capacity')
    if (!mountedRef.current) return
    if (rpcError) {
      setError(rpcError.message)
    } else {
      setError(null)
      setShifts(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { shifts, loading, error, refetch }
}
