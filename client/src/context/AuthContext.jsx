import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

const withTimeout = (promise, ms) => {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }
      setProfile(data ?? null)
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const ensureProfile = async (userId, username) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (existing) return

    const { error } = await supabase.from('profiles').upsert(
      [{ id: userId, username: username || `trainer_${userId.slice(0, 6)}`, avatar_url: null }],
      { onConflict: 'id' }
    )
    if (error) throw error
  }

  const signUp = async (email, password, username) => {
    const trimmed = username.trim()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: trimmed },
      },
    })

    if (error) throw error

    // Only insert profile when we have an active session (email confirm may be off)
    if (data.user && data.session) {
      try {
        await ensureProfile(data.user.id, trimmed)
        await fetchProfile(data.user.id)
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
        throw new Error(
          profileError.message ||
            'Cuenta creada, pero no se pudo guardar el perfil. Intenta iniciar sesión.'
        )
      }
    }

    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (data.user) {
      const username = data.user.user_metadata?.username
      try {
        await ensureProfile(data.user.id, username)
      } catch (e) {
        console.error('Profile ensure failed:', e)
      }
    }

    return data
  }

  const resetPassword = async (email) => {
    const redirectTo = `${window.location.origin}/`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  }

  const signOut = async () => {
    try {
      const result = await withTimeout(supabase.auth.signOut(), 8000)
      if (result?.error) throw result.error
    } catch {
      try {
        supabase.auth.signOut()
      } catch {
        // ignore
      }
    } finally {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    fetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
