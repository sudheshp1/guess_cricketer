import type { Clue } from '../types'

interface Props {
  clues: readonly Clue[]
  /** Index of the first clue to show (for the "other clues" list after a round). */
  from?: number
  /** Show clues up to (not including) this index. */
  to: number
  /** Highlight the last visible clue as the newest one. */
  highlightLatest?: boolean
  /** Show a "N more clues locked" line for clues after `to`. */
  showLocked?: boolean
  label?: string
}

/** Numbered clue cards. */
export function ClueList({
  clues,
  from = 0,
  to,
  highlightLatest = false,
  showLocked = false,
  label = 'Clues',
}: Props) {
  const locked = clues.length - to
  return (
    <ol className="grid grid-cols-1 gap-2 sm:gap-3 2xl:grid-cols-2" aria-label={label}>
      {clues.slice(from, to).map((clue, offset) => {
        const i = from + offset
        const latest = highlightLatest && i === to - 1
        return (
          <li
            key={clue.key}
            className={`clue-in flex gap-3 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${
              latest
                ? 'border-green-700 bg-green-50 dark:border-green-600 dark:bg-green-950'
                : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white tabular-nums ${
                latest ? 'bg-correct' : 'bg-wrong'
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                {clue.title}
              </p>
              <p
                className={`font-medium text-gray-900 sm:text-lg dark:text-gray-100 ${clue.key === 'initials' ? 'font-mono tracking-wider' : ''}`}
              >
                {clue.text}
              </p>
              {clue.note && (
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{clue.note}</p>
              )}
            </div>
          </li>
        )
      })}
      {showLocked && locked > 0 && (
        <li className="col-span-full rounded-xl border border-dashed border-gray-300 px-3 py-2 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
          {locked} more {locked === 1 ? 'clue' : 'clues'} locked
        </li>
      )}
    </ol>
  )
}
