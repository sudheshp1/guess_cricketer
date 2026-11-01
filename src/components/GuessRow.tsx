import { FLIP_STAGGER_MS } from '../config'
import type { GuessResult, Player } from '../types'
import { FeedbackCell } from './FeedbackCell'

interface Props {
  player: Player
  result: GuessResult
  guessNumber: number
  animate: boolean
}

export function GuessRow({ player, result, guessNumber, animate }: Props) {
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2 px-0.5 text-sm">
        <span className="text-xs text-gray-600 tabular-nums dark:text-gray-400">
          <span className="sr-only">Guess </span>
          {guessNumber}.
        </span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{player.name}</span>
        {result.isCorrect && <span aria-hidden="true">🏏</span>}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {result.cells.map((cell, i) => (
          <FeedbackCell
            key={cell.key}
            cell={cell}
            revealDelayMs={animate ? i * FLIP_STAGGER_MS : undefined}
          />
        ))}
      </div>
    </li>
  )
}
