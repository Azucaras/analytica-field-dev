/**
 * R-27 and R-42: the hover tooltip. It prints one class name and nothing else, it is
 * `aria-hidden` because the readout already carries the same content, and it never takes a
 * pointer event. Its position is computed by `placeTooltip`, which also decides whether the
 * box may mount at all.
 */
import { POLYGON_TOOLTIP_MAX_WIDTH } from '@/lib/polygon-tooltip'

export const POLYGON_TOOLTIP_CLASS = 'polygon-tooltip'

export type PolygonTooltipProps = {
  text: string
  left: number
  top: number
}

export function PolygonTooltip({ text, left, top }: PolygonTooltipProps) {
  return (
    <div
      aria-hidden="true"
      className={POLYGON_TOOLTIP_CLASS}
      data-polygon-tooltip
      role="presentation"
      style={{ left, top, maxWidth: POLYGON_TOOLTIP_MAX_WIDTH }}
    >
      {text}
    </div>
  )
}
