/**
 * Best-effort "is this a phone/tablet" check — there is no reliable way to
 * detect device type from client-side JS alone (desktop browsers can spoof
 * their UA, and some tablets report as desktop or vice versa). This checks
 * the UA string for the common mobile OS tokens first, then falls back to a
 * coarse-pointer media query (true on touchscreens, false on a mouse/trackpad
 * -driven desktop) for browsers that omit or spoof a matching UA.
 */
export function isMobileDevice() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(pointer: coarse)').matches
  }
  return false
}
