import type { PlayerPool } from '../types'

const OPTIONS: { value: PlayerPool; label: string; hint: string }[] = [
  { value: 'famous', label: 'Famous', hint: 'Household names only' },
  { value: 'regular', label: 'Regular', hint: 'Players regular fans know' },
  { value: 'all', label: 'All', hint: 'Includes deep cuts' },
]

interface Props {
  pool: PlayerPool
  onChange: (pool: PlayerPool) => void
}

/** Segmented control choosing which players can be the answer (applies from the next round). */
export function PoolPicker({ pool, onChange }: Props) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">Mystery player pool</legend>
      <div className="grid grid-cols-3 gap-1 rounded-full border border-line bg-surface-2 p-1">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            title={o.hint}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold-fill ${
              pool === o.value ? 'bg-brand text-on-brand shadow' : 'text-muted hover:text-ink'
            }`}
          >
            <input
              type="radio"
              name="player-pool"
              value={o.value}
              checked={pool === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">Applies from the next player.</p>
    </fieldset>
  )
}
