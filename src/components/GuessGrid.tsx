import { COLUMN_LABELS } from '../lib/format'
import type { AttributeKey, GuessResult, Player } from '../types'
import { GuessRow } from './GuessRow'

const COLUMNS: AttributeKey[] = [
  'country',
  'role',
  'battingHand',
  'bowlingType',
  'debutYear',
  'intlMatches',
  'active',
]

interface Props {
  guesses: readonly Player[]
  results: readonly GuessResult[]
  /** Guesses at or after this index were made this session and flip in. */
  animateFrom: number
}

/** Header row plus one row per guess, newest first so it sits right under the input. */
export function GuessGrid({ guesses, results, animateFrom }: Props) {
  if (guesses.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Make your first guess. Each guess shows how close you are on 7 attributes.
      </p>
    )
  }
  const order = guesses.map((_, i) => i).reverse()
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden="true" className="grid grid-cols-7 gap-1">
        {COLUMNS.map((key) => (
          <div
            key={key}
            title={COLUMN_LABELS[key].full}
            className="text-center text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:text-xs dark:text-gray-400"
          >
            {COLUMN_LABELS[key].short}
          </div>
        ))}
      </div>
      <ol aria-label="Your guesses, newest first" className="flex flex-col gap-3">
        {order.map((i) => (
          <GuessRow
            key={guesses[i]!.id}
            player={guesses[i]!}
            result={results[i]!}
            guessNumber={i + 1}
            animate={i >= animateFrom}
          />
        ))}
      </ol>
    </div>
  )
}
