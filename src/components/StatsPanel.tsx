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
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {figures.map((f) => (
          <div
            key={f.label}
            className="flex flex-col-reverse rounded-2xl border border-line bg-surface-2 px-2 py-3 text-center"
          >
            <dt className="text-xs leading-tight font-medium text-muted">{f.label}</dt>
            <dd className="text-2xl font-extrabold tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="eyebrow mt-6 mb-2.5">Solved on clue</h3>
      {stats.wins === 0 ? (
        <p className="text-sm text-muted">No wins yet. Your first one will show up here.</p>
      ) : (
        <ol className="flex flex-col gap-1.5" aria-label="Wins by clue number">
          {stats.distribution.map((count, i) => {
            const clue = i + 1
            const highlight = clue === highlightClue
            return (
              <li key={clue} className="flex items-center gap-2.5 text-sm">
                <span
                  className="w-5 text-right font-semibold text-muted tabular-nums"
                  aria-hidden="true"
                >
                  {clue}
                </span>
                <span className="sr-only">
                  Clue {clue}: {count} {count === 1 ? 'win' : 'wins'}
                </span>
                <div className="flex-1" aria-hidden="true">
                  <div
                    className={`min-w-8 rounded-lg px-2.5 py-1 text-right text-xs font-bold tabular-nums ${
                      highlight
                        ? 'bg-brand text-on-brand'
                        : count > 0
                          ? 'bg-brand-soft text-ink'
                          : 'bg-surface-2 text-muted'
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
