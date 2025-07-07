'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, userData?: Partial<UserProfile>) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Fetch user profile from our custom users table
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }, [supabase])

  // Create user profile in our custom users table
  const createUserProfile = useCallback(async (user: User, additionalData?: Partial<UserProfile>) => {
    try {
      const profileData = {
        id: user.id,
        email: user.email!,
        username: null,
        full_name: user.user_metadata.full_name || null,
        avatar_url: user.user_metadata.avatar_url || null,
        user_type: 'buyer' as const,
        verified: false,
        bio: null,
        expertise_tags: null,
        location: null,
        website_url: null,
        social_links: null,
        notification_preferences: null,
        ...additionalData
      }

      const { error } = await supabase
        .from('users')
        .insert([profileData])

      if (error) {
        console.error('Error creating user profile:', error)
        return null
      }

      return profileData as UserProfile
    } catch (error) {
      console.error('Error creating user profile:', error)
      return null
    }
  }, [supabase])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData?: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      })

      if (error) return { error }

      // Create profile in our users table if sign up was successful
      if (data.user && !error) {
        await createUserProfile(data.user, userData)
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Sign in with OAuth
  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user found') }

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (!error) {
        setUserProfile(prev => prev ? { ...prev, ...updates } : null)
      }

      return { error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
    }
  }

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (!user) return

    const profile = await fetchUserProfile(user.id)
    setUserProfile(profile)
  }, [user, fetchUserProfile])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch or create user profile
        let profile = await fetchUserProfile(session.user.id)
        
        if (!profile) {
          // Create profile if it doesn't exist (for OAuth users)
          profile = await createUserProfile(session.user)
        }
        
        setUserProfile(profile)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Fetch or create user profile
          let profile = await fetchUserProfile(session.user.id)
          
          if (!profile && event === 'SIGNED_IN') {
            // Create profile if it doesn't exist (for OAuth users)
            profile = await createUserProfile(session.user)
          }
          
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, createUserProfile, supabase.auth])

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithOAuth,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}