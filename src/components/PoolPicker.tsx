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
    <fieldset className="flex flex-wrap items-center justify-center gap-2 text-sm">
      <legend className="sr-only">Mystery player pool</legend>
      <span className="text-gray-600 dark:text-gray-400" aria-hidden="true">
        Players:
      </span>
      <div className="inline-flex rounded-full border border-gray-300 p-0.5 dark:border-gray-700">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            title={o.hint}
            className={`cursor-pointer rounded-full px-3 py-1 font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-green-700 ${
              pool === o.value
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
    </fieldset>
  )
}
