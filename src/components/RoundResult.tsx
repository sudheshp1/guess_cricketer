import { MAX_CLUES } from '../config'
import type { Player, Round } from '../types'

interface Props {
  round: Round
  answer: Player
  onNext: () => void
  onShare: () => void
}

/** Shown when a round ends: the answer plus next/share actions. */
export function RoundResult({ round, answer, onNext, onShare }: Props) {
  const won = round.status === 'won'
  const heading = won
    ? round.cluesRevealed === 1
      ? 'Got it on the first clue!'
      : `Got it on clue ${round.cluesRevealed} of ${MAX_CLUES}`
    : round.gaveUp
      ? 'You gave up'
      : 'Out of clues'
  return (
    <section
      aria-labelledby="round-result-heading"
      className={`rounded-2xl border p-4 ${
        won
          ? 'border-green-700 bg-green-50 dark:border-green-600 dark:bg-green-950'
          : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      <h2 id="round-result-heading" className="text-lg font-bold">
        {heading}
      </h2>
      <p className="mt-1">
        The player was <strong className="text-xl">{answer.name}</strong>
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {answer.country} · {answer.role} · {answer.intlMatches} international matches
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onNext}
          autoFocus
          className="flex-1 rounded-full bg-correct px-5 py-3 font-bold text-white shadow hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        >
          Next player
        </button>
        <button
          type="button"
          onClick={onShare}
          className="rounded-full border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          Share
        </button>
      </div>
    </section>
  )
}
