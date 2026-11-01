import { displayedStreak, winPercentage } from '../lib/stats'
import type { Stats } from '../types'

interface Props {
  stats: Stats
  puzzleNumber: number
  /** Guess count of today's win, highlighted in the chart. */
  highlightGuesses?: number
}

/** Headline numbers plus the guess distribution bar chart. */
export function StatsPanel({ stats, puzzleNumber, highlightGuesses }: Props) {
  const figures = [
    { label: 'Played', value: stats.played },
    { label: 'Win %', value: winPercentage(stats) },
    { label: 'Current streak', value: displayedStreak(stats, puzzleNumber) },
    { label: 'Max streak', value: stats.maxStreak },
  ]
  const max = Math.max(1, ...stats.distribution)

  return (
    <div>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col-reverse">
            <dt className="text-xs leading-tight text-gray-600 dark:text-gray-400">{f.label}</dt>
            <dd className="text-2xl font-bold tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-5 mb-2 text-sm font-semibold">Guess distribution</h3>
      {stats.wins === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No wins yet.</p>
      ) : (
        <ol className="flex flex-col gap-1" aria-label="Wins by number of guesses">
          {stats.distribution.map((count, i) => {
            const guesses = i + 1
            const highlight = guesses === highlightGuesses
            return (
              <li key={guesses} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-right tabular-nums" aria-hidden="true">
                  {guesses}
                </span>
                <span className="sr-only">
                  {guesses} {guesses === 1 ? 'guess' : 'guesses'}: {count}{' '}
                  {count === 1 ? 'win' : 'wins'}
                </span>
                <div className="flex-1" aria-hidden="true">
                  <div
                    className={`min-w-6 rounded px-2 py-0.5 text-right text-xs font-bold text-white tabular-nums ${
                      highlight ? 'bg-correct' : 'bg-wrong'
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
