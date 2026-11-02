import { MIND_MAX_GUESSES, MIND_MAX_QUESTIONS } from '../config'
import type { MindStatus } from '../lib/mind'
import { CricketBall } from './Icons'

interface Props {
  status: MindStatus
  questionsAsked: number
  guessesMade: number
}

/** Title plus progress: one pip per question and one per guess. */
export function MindHero({ status, questionsAsked, guessesMade }: Props) {
  const over = status !== 'playing'
  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <CricketBall className="h-16 w-16 text-3xl sm:h-20 sm:w-20 sm:text-4xl" spin={!over}>
        <span aria-hidden="true">{status === 'won' ? '✓' : '?'}</span>
      </CricketBall>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2
            id="mind-heading"
            className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl"
          >
            I&rsquo;ll read your mind
          </h2>
          <p className="text-sm font-semibold text-muted tabular-nums sm:text-base">
            Question {Math.min(questionsAsked + (over ? 0 : 1), MIND_MAX_QUESTIONS)} of{' '}
            {MIND_MAX_QUESTIONS}
          </p>
        </div>
        <div className="mt-2.5 flex items-center gap-3" aria-hidden="true">
          <ol className="flex flex-1 gap-1.5 sm:gap-2">
            {Array.from({ length: MIND_MAX_QUESTIONS }, (_, i) => (
              <li
                key={i}
                className={`h-3 flex-1 rounded-full transition-colors duration-300 sm:h-3.5 ${
                  i < questionsAsked ? 'bg-ball' : 'border border-line-strong bg-transparent'
                }`}
              />
            ))}
          </ol>
          <ol className="flex gap-1.5">
            {Array.from({ length: MIND_MAX_GUESSES }, (_, i) => (
              <li
                key={i}
                className={`h-3 w-3 rounded-full sm:h-3.5 sm:w-3.5 ${
                  i < guessesMade ? 'bg-gold-fill' : 'border border-line-strong bg-transparent'
                }`}
              />
            ))}
          </ol>
        </div>
        <p className="mt-1.5 text-xs font-medium text-muted">
          {MIND_MAX_GUESSES - guessesMade} of {MIND_MAX_GUESSES} guesses left
        </p>
      </div>
    </div>
  )
}
