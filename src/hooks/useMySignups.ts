import { useCallback, useEffect, useRef, useState } from 'react'
import type { AttendanceStatus } from '../lib/shiftDisplay'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

export function useMySignups() {
  const { user } = useAuth()
  const [myStatusByShiftId, setMyStatusByShiftId] = useState<Map<string, AttendanceStatus>>(
    new Map(),
  )
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
      setMyStatusByShiftId(new Map())
      setLoading(false)
      return
    }
    setLoading(true)
    // 'cancelled' is deliberately excluded — it frees the volunteer to sign
    // up again, so it should look identical to never having signed up.
    const { data } = await supabase
      .from('signups')
      .select('shift_id, status')
      .eq('volunteer_id', user.id)
      .in('status', ['confirmed', 'completed', 'no_show'])
    if (!mountedRef.current) return
    setMyStatusByShiftId(
      new Map((data ?? []).map((row) => [row.shift_id, row.status as AttendanceStatus])),
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { myStatusByShiftId, loading, refetch }
}
