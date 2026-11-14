import { RECORDED_LAYERS_RESPONSE } from '@/lib/recorded-layers-response'
import type { LayersResponse } from '@/lib/layer-catalog'

/**
 * The `/layers` object the tests answer with. Since R-14 the response is an object with
 * `chosen_date`, `axis` and `layers`, so a test that stubs an array is stubbing a contract
 * that no longer exists.
 */
export function layersResponse(chosenDate = '2026-11-12'): LayersResponse {
  return {
    ...RECORDED_LAYERS_RESPONSE,
    chosen_date: chosenDate,
    layers: RECORDED_LAYERS_RESPONSE.layers.map((layer) => ({ ...layer })),
  }
}
