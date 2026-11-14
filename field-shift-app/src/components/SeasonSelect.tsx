import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { t } from '@/strings'

type SeasonSelectProps = {
  seasons: string[]
  default_season?: string
  onChange: (season: string) => void
}

export function SeasonSelect({
  seasons,
  default_season = '2025/26',
  onChange,
}: SeasonSelectProps) {
  return (
    <Select defaultValue={default_season} onValueChange={(season) => {
      if (season !== null) onChange(season)
    }}>
      <SelectTrigger aria-label={t('season.label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {seasons.map((season) => (
          <SelectItem key={season} value={season}>{season}</SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}
