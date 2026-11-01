import { MAX_GUESSES } from '../config'
import { formatValue } from '../lib/format'
import type { GuessResult, Player, Stats } from '../types'
import { Countdown } from './Countdown'
import { Modal } from './Modal'
import { StatsPanel } from './StatsPanel'

interface Props {
  open: boolean
  onClose: () => void
  won: boolean
  answer: Player
  results: readonly GuessResult[]
  stats: Stats
  puzzleNumber: number
  onShare: () => void
  now?: () => Date
}

export function ResultModal({
  open,
  onClose,
  won,
  answer,
  results,
  stats,
  puzzleNumber,
  onShare,
  now,
}: Props) {
  const facts = [
    answer.country,
    answer.role,
    formatValue({ key: 'battingHand', value: answer.battingHand }).full,
    formatValue({ key: 'bowlingType', value: answer.bowlingType }).full,
    `Debut ${answer.debutYear}`,
    `${answer.intlMatches} intl matches`,
    answer.active ? 'Active' : 'Retired',
  ]

  return (
    <Modal title={won ? 'Well played!' : 'Stumped!'} open={open} onClose={onClose}>
      <p className="text-sm">
        {won
          ? `You found the cricketer in ${results.length}/${MAX_GUESSES} ${results.length === 1 ? 'guess' : 'guesses'}.`
          : `You used all ${MAX_GUESSES} guesses.`}
      </p>
      <div className="mt-3 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
          Today's answer
        </p>
        <p className="text-lg font-bold">{answer.name}</p>
        <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">{facts.join(' · ')}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <Countdown now={now} />
        <button
          type="button"
          onClick={onShare}
          className="rounded-full bg-correct px-6 py-3 font-bold text-white shadow hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        >
          Share
        </button>
      </div>

      <hr className="my-4 border-gray-200 dark:border-gray-700" />
      <StatsPanel
        stats={stats}
        puzzleNumber={puzzleNumber}
        highlightGuesses={won ? results.length : undefined}
      />
    </Modal>
  )
}
