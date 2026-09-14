import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { updateThemePreference } from '../firebase/studentService'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(undefined)

const VALID_PREFERENCES = ['light', 'dark', 'system']

function getSystemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Resolves and applies the app's light/dark theme, and keeps it in sync with
 * `students/{uid}.temaPreferido` once a student profile exists.
 *
 * Before auth (or before onboarding creates a profile), `preference` lives
 * only in memory here — "system" by default, or whatever the student picked
 * with the toggle on Login/Signup. Once `user` + `studentProfile` are both
 * available we sync exactly once per session: if the student had explicitly
 * toggled the theme pre-auth, that local choice wins and gets written to
 * Firestore (Onboarding also passes it straight through when it first
 * creates the profile — see saveStudentProfile calls); otherwise we adopt
 * whatever is already stored (defaulting to "system" if never set).
 */
export function ThemeProvider({ children }) {
  const { user, studentProfile, profileLoading } = useAuth()
  const [preference, setPreferenceState] = useState('system')
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark)
  const preAuthOverrideRef = useRef(false)
  const syncedUidRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(event) {
      setSystemPrefersDark(event.matches)
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const effectiveTheme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
  }, [effectiveTheme])

  useEffect(() => {
    if (!user) {
      syncedUidRef.current = null
      return
    }
    if (profileLoading || !studentProfile) return
    if (syncedUidRef.current === user.uid) return
    syncedUidRef.current = user.uid

    if (preAuthOverrideRef.current) {
      preAuthOverrideRef.current = false
      if (studentProfile.temaPreferido !== preference) {
        updateThemePreference(user.uid, preference).catch((err) => console.error(err))
      }
      return
    }

    setPreferenceState(studentProfile.temaPreferido ?? 'system')
    // `preference` deliberately excluded from the dependency array: it's only
    // read inside the pre-auth-override branch above, and including it would
    // re-run this sync on every local toggle instead of once per login session.
  }, [user, studentProfile, profileLoading])

  const setPreference = useCallback(
    (next) => {
      if (!VALID_PREFERENCES.includes(next)) return
      setPreferenceState(next)
      if (user && studentProfile) {
        updateThemePreference(user.uid, next).catch((err) => console.error(err))
      } else {
        preAuthOverrideRef.current = true
      }
    },
    [user, studentProfile],
  )

  const value = { preference, effectiveTheme, setPreference }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
