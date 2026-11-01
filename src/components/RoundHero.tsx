import { MAX_CLUES } from '../config'
import type { Player, Round } from '../types'
import { CricketBall } from './Icons'

interface Props {
  round: Round
  answer: Player
}

function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
}

/** Mystery ball, title and a row of "deliveries" showing clue progress. */
export function RoundHero({ round, answer }: Props) {
  const over = round.status !== 'playing'
  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <CricketBall
        className="h-16 w-16 text-3xl sm:h-20 sm:w-20 sm:text-4xl"
        spin={!over}
        key={over ? 'revealed' : 'mystery'}
      >
        <span className={over ? 'pop inline-block' : undefined} aria-hidden="true">
          {over ? initials(answer.name) : '?'}
        </span>
      </CricketBall>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2
            id="clues-heading"
            className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl"
          >
            Who is this cricketer?
          </h2>
          <p className="text-sm font-semibold text-muted tabular-nums sm:text-base">
            Clue {round.cluesRevealed} of {MAX_CLUES}
          </p>
        </div>
        <ol className="mt-2.5 flex gap-1.5 sm:gap-2" aria-hidden="true">
          {Array.from({ length: MAX_CLUES }, (_, i) => {
            const used = i < round.cluesRevealed
            const current = i === round.cluesRevealed - 1
            const solved = round.status === 'won' && current
            return (
              <li
                key={i}
                className={`h-3 flex-1 rounded-full transition-colors duration-300 sm:h-3.5 ${
                  solved
                    ? 'bg-brand'
                    : current && !over
                      ? 'bg-gold-fill shadow-[0_0_0_3px_rgb(251_191_36/0.25)]'
                      : used
                        ? 'bg-ball'
                        : 'border border-line-strong bg-transparent'
                }`}
              />
            )
          })}
        </ol>
      </div>
    </div>
  )
}
