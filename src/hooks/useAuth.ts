import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export type UserRole = 'volunteer' | 'coordinator'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
}

interface SignUpDetails {
  email: string
  password: string
  fullName: string
  phone?: string
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone')
    .eq('id', userId)
    .single()
  return data
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      setSession(data.session)
      const nextProfile = data.session ? await fetchProfile(data.session.user.id) : null
      if (cancelled) return
      setProfile(nextProfile)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        fetchProfile(newSession.user.id).then((p) => {
          if (!cancelled) setProfile(p)
        })
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function signUp({ email, password, fullName, phone }: SignUpDetails) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone || null },
      },
    })
    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const signedInProfile = await fetchProfile(data.user.id)
    setProfile(signedInProfile)
    return { ...data, profile: signedInProfile }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  }
}
