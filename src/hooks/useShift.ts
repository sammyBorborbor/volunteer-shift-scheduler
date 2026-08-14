import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface EditableShift {
  id: string
  title: string
  description: string | null
  location: string | null
  date: string
  start_time: string
  end_time: string
  capacity: number
  cancelled_at: string | null
}

export function useShift(shiftId: string) {
  const [shift, setShift] = useState<EditableShift | null>(null)
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
    const { data, error: fetchError } = await supabase
      .from('shifts')
      .select('id, title, description, location, date, start_time, end_time, capacity, cancelled_at')
      .eq('id', shiftId)
      .maybeSingle()
    if (!mountedRef.current) return
    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }
    if (!data) {
      setError('Shift not found')
      setLoading(false)
      return
    }
    setError(null)
    setShift(data)
    setLoading(false)
  }, [shiftId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { shift, loading, error, refetch }
}
