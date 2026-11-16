import { useEffect, useState } from 'react'
import type { ZarcSnapshot } from '@/lib/season-band'

// The recorded ZARC snapshot is 249 KB. It is its own chunk, fetched once after the first paint
// instead of being part of the bundle every page load parses.
let zarcLoaded: ZarcSnapshot | null | undefined
let zarcRequest: Promise<ZarcSnapshot | null> | null = null

function loadZarcSnapshot(): Promise<ZarcSnapshot | null> {
  zarcRequest ??= import('../../artifacts/zarc-mt-snapshot.json')
    .then((module) => (zarcLoaded = module.default as unknown as ZarcSnapshot))
    .catch(() => (zarcLoaded = null))
  return zarcRequest
}

/** The snapshot a caller passed, else the recorded one once it has loaded (undefined until then). */
export function useZarcSnapshot(given: ZarcSnapshot | null | undefined): ZarcSnapshot | null | undefined {
  const [loaded, setLoaded] = useState(zarcLoaded)
  useEffect(() => {
    if (given !== undefined || zarcLoaded !== undefined) return
    let live = true
    void loadZarcSnapshot().then((value) => { if (live) setLoaded(value) })
    return () => { live = false }
  }, [given])
  return given !== undefined ? given : loaded
}
