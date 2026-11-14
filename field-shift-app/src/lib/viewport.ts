import { useEffect, useState } from 'react'

/**
 * The three widths of the block 4 layout contract, read as media queries so a test can
 * stub them the way the block 3 tests already stub `matchMedia`.
 *
 * NARROW is 360x640, COMPACT covers 780x900, and a viewport wider than 1020 is the 1440
 * layout. COMPACT is the boundary the block 3 stylesheet already uses for the 780 rules,
 * so the dock and the rotation panel switch at the same width as the rest of the shell.
 */
export const NARROW_QUERY = '(max-width: 640px)'
export const COMPACT_QUERY = '(max-width: 1020px)'

export function matchesQuery(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

/**
 * The first-paint width bucket. It is read once, at mount, because R-40 and R-52 say a
 * resize SHALL NOT reapply the default of the destination width: the state the user set
 * survives a resize, and only a reload returns the default.
 */
export function isNarrowViewport(): boolean {
  return matchesQuery(NARROW_QUERY)
}

export function isCompactViewport(): boolean {
  return matchesQuery(COMPACT_QUERY)
}

/**
 * A live read of one query, used only for structure (where a control is mounted), never
 * for a toggle state. A resize may move the `Timeline controls` toggle between the
 * region and its sibling slot; it may not change whether the dock is expanded.
 */
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
