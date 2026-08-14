import { useCallback, useEffect, useRef, useState } from 'react'
import type { SignupHistoryStatus } from '../lib/shiftDisplay'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

export interface ShiftHistoryEntry {
  signupId: string
  status: SignupHistoryStatus
  signedUpAt: string
  shift: {
    id: string
    title: string
    description: string | null
    location: string | null
    date: string
    start_time: string
    end_time: string
    cancelled_at: string | null
  }
}

interface SignupRow {
  id: string
  status: SignupHistoryStatus
  signed_up_at: string
  shifts: ShiftHistoryEntry['shift'] | null
}

export function useMyShiftHistory() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ShiftHistoryEntry[]>([])
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
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    // Deliberately no date filter here (unlike useShifts) — this view's
    // whole point is showing past shifts too.
    const { data, error: fetchError } = await supabase
      .from('signups')
      .select(
        'id, status, signed_up_at, shifts(id, title, description, location, date, start_time, end_time, cancelled_at)',
      )
      .eq('volunteer_id', user.id)
    if (!mountedRef.current) return
    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }
    setError(null)
    setEntries(
      ((data ?? []) as unknown as SignupRow[])
        .filter((row) => row.shifts)
        .map((row) => ({
          signupId: row.id,
          status: row.status,
          signedUpAt: row.signed_up_at,
          shift: row.shifts!,
        })),
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { entries, loading, error, refetch }
}
