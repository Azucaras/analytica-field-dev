import { useEffect, useState } from 'react'

/** Below this width the shell folds every panel into one sheet under the map. */
export const PHONE_QUERY = '(max-width: 760px)'

export function matchesQuery(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

/** A live read of one media query; the shell uses it to choose the wide or the phone layout. */
export function useMediaMatch(query: string): boolean {
  const [matches, setMatches] = useState(() => matchesQuery(query))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', handleChange)
    return () => list.removeEventListener('change', handleChange)
  }, [query])

  return matches
}
