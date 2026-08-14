import { useCallback, useEffect, useRef, useState } from 'react'
import type { AttendanceStatus } from '../lib/shiftDisplay'
import { supabase } from '../lib/supabaseClient'

export interface RosterShift {
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

export interface RosterEntry {
  signupId: string
  volunteerId: string
  fullName: string
  phone: string | null
  signedUpAt: string
  status: AttendanceStatus
}

interface SignupRow {
  id: string
  signed_up_at: string
  volunteer_id: string
  status: AttendanceStatus
  profiles: { full_name: string; phone: string | null } | null
}

export function useRoster(shiftId: string) {
  const [shift, setShift] = useState<RosterShift | null>(null)
  const [entries, setEntries] = useState<RosterEntry[]>([])
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
    const [shiftResult, signupsResult] = await Promise.all([
      supabase
        .from('shifts')
        .select('id, title, description, location, date, start_time, end_time, capacity, cancelled_at')
        .eq('id', shiftId)
        .maybeSingle(),
      supabase
        .from('signups')
        .select('id, signed_up_at, volunteer_id, status, profiles(full_name, phone)')
        .eq('shift_id', shiftId)
        .in('status', ['confirmed', 'completed', 'no_show'])
        .order('signed_up_at'),
    ])
    if (!mountedRef.current) return

    if (shiftResult.error) {
      setError(shiftResult.error.message)
      setLoading(false)
      return
    }
    if (!shiftResult.data) {
      setError('Shift not found')
      setLoading(false)
      return
    }
    if (signupsResult.error) {
      setError(signupsResult.error.message)
      setLoading(false)
      return
    }

    setError(null)
    setShift(shiftResult.data)
    setEntries(
      ((signupsResult.data ?? []) as unknown as SignupRow[])
        .filter((row) => row.profiles)
        .map((row) => ({
          signupId: row.id,
          volunteerId: row.volunteer_id,
          fullName: row.profiles!.full_name,
          phone: row.profiles!.phone,
          signedUpAt: row.signed_up_at,
          status: row.status,
        })),
    )
    setLoading(false)
  }, [shiftId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const cancelShift = useCallback(async () => {
    const { error: rpcError } = await supabase.rpc('cancel_shift', { p_shift_id: shiftId })
    if (rpcError) throw rpcError
    await refetch()
  }, [shiftId, refetch])

  return { shift, entries, loading, error, refetch, cancelShift }
}
