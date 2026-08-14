import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

export function useMySignups() {
  const { user } = useAuth()
  const [signedUpShiftIds, setSignedUpShiftIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refetch = useCallback(async () => {
    if (!user) {
      setSignedUpShiftIds(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('signups')
      .select('shift_id')
      .eq('volunteer_id', user.id)
      .eq('status', 'confirmed')
    if (!mountedRef.current) return
    setSignedUpShiftIds(new Set((data ?? []).map((row) => row.shift_id)))
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { signedUpShiftIds, loading, refetch }
}
