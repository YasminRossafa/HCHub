import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
// Region must match where the callables are deployed (functions/index.js uses
// the default, us-central1) — a mismatch fails with `not-found`.
export const functions = getFunctions(app)

/*
 * Local development against the Firebase Emulator Suite. Opt-in via
 * `VITE_USE_EMULATORS=true` (see .env.example) — ports mirror firebase.json.
 * Vite strips this whole block from production builds when the flag is
 * unset, and the `import.meta.env.DEV` guard means it can never activate in
 * a deployed bundle even if the variable leaks into a hosting config.
 */
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  const host = window.location.hostname
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, 8080)
  connectFunctionsEmulator(functions, host, 5001)
  connectStorageEmulator(storage, host, 9199)
}
