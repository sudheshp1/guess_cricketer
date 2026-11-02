import { averageQuestions, gameWinPercentage } from '../lib/mindStats'
import type { MindStats } from '../types'

interface Props {
  stats: MindStats
  /** Questions used in the latest game win, highlighted in the chart. */
  highlightQuestions?: number
}

/** Mind Reader headline numbers plus a "guessed after N questions" bar chart. */
export function MindStatsPanel({ stats, highlightQuestions }: Props) {
  const avg = averageQuestions(stats)
  const figures = [
    { label: 'Played', value: stats.played },
    { label: 'I guessed', value: stats.gameWins },
    { label: 'You won', value: stats.played - stats.gameWins },
    { label: 'My win %', value: gameWinPercentage(stats) },
    { label: 'Avg questions', value: avg ?? '–' },
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

      <h3 className="eyebrow mt-6 mb-2.5">I guessed you after</h3>
      {stats.gameWins === 0 ? (
        <p className="text-sm text-muted">
          I haven&rsquo;t read your mind yet. My first correct guess will show up here.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5" aria-label="Correct guesses by questions asked">
          {stats.distribution.map((count, i) => {
            const n = i + 1
            const highlight = n === highlightQuestions
            return (
              <li key={n} className="flex items-center gap-2.5 text-sm">
                <span
                  className="w-5 text-right font-semibold text-muted tabular-nums"
                  aria-hidden="true"
                >
                  {n}
                </span>
                <span className="sr-only">
                  {n} {n === 1 ? 'question' : 'questions'}: {count}{' '}
                  {count === 1 ? 'round' : 'rounds'}
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
