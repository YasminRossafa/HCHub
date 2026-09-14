import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from '../firebase/authService'
import { getStudentProfile } from '../firebase/studentService'

const AuthContext = createContext(undefined)

/**
 * Tracks the Firebase session and, once a user is known, their Firestore
 * student profile — the two pieces every route guard in App.jsx needs.
 * `authLoading` covers the initial "is there a session?" check; `profileLoading`
 * covers the Firestore read that follows once a user is signed in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const refreshStudentProfile = useCallback(async (uid) => {
    setProfileLoading(true)
    try {
      const profile = await getStudentProfile(uid)
      setStudentProfile(profile)
      return profile
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
      if (firebaseUser) {
        await refreshStudentProfile(firebaseUser.uid)
      } else {
        setStudentProfile(null)
      }
    })
    return unsubscribe
  }, [refreshStudentProfile])

  const value = { user, authLoading, studentProfile, profileLoading, refreshStudentProfile }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
