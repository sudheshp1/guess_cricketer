import { averageClues, winPercentage } from '../lib/stats'
import type { Stats } from '../types'

interface Props {
  stats: Stats
  /** Clue number of the latest win, highlighted in the chart. */
  highlightClue?: number
}

/** Headline numbers plus a "solved on clue N" bar chart. */
export function StatsPanel({ stats, highlightClue }: Props) {
  const avg = averageClues(stats)
  const figures = [
    { label: 'Played', value: stats.played },
    { label: 'Win %', value: winPercentage(stats) },
    { label: 'Streak', value: stats.currentStreak },
    { label: 'Best streak', value: stats.maxStreak },
    { label: 'Avg clues', value: avg ?? '–' },
  ]
  const max = Math.max(1, ...stats.distribution)

  return (
    <div>
      <dl className="grid grid-cols-5 gap-1 text-center">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col-reverse">
            <dt className="text-[11px] leading-tight text-gray-600 dark:text-gray-400">
              {f.label}
            </dt>
            <dd className="text-2xl font-bold tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-5 mb-2 text-sm font-semibold">Solved on clue</h3>
      {stats.wins === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No wins yet.</p>
      ) : (
        <ol className="flex flex-col gap-1" aria-label="Wins by clue number">
          {stats.distribution.map((count, i) => {
            const clue = i + 1
            return (
              <li key={clue} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-right tabular-nums" aria-hidden="true">
                  {clue}
                </span>
                <span className="sr-only">
                  Clue {clue}: {count} {count === 1 ? 'win' : 'wins'}
                </span>
                <div className="flex-1" aria-hidden="true">
                  <div
                    className={`min-w-6 rounded px-2 py-0.5 text-right text-xs font-bold text-white tabular-nums ${
                      clue === highlightClue ? 'bg-correct' : 'bg-wrong'
                    }`}
                    style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
                  >
                    {count}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
