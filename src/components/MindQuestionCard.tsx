import { Check, CircleHelp, Flag, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { MindMove } from '../lib/mind'
import type { MindAnswer } from '../types'

interface Props {
  /** The game's current question or guess (never null here). */
  move: NonNullable<MindMove>
  number: number
  /** Move focus to the first button when the card appears. */
  autoFocus: boolean
  onAnswer: (answer: MindAnswer) => void
  onGuessResponse: (correct: boolean) => void
  onGiveUp: () => void
}

/** The current question (Yes / No / Not sure) or guess (Yes / No). */
export function MindQuestionCard({
  move,
  number,
  autoFocus,
  onAnswer,
  onGuessResponse,
  onGiveUp,
}: Props) {
  const firstButton = useRef<HTMLButtonElement>(null)
  const isGuess = move.kind === 'guess'

  useEffect(() => {
    if (autoFocus) firstButton.current?.focus()
  }, [autoFocus])

  return (
    <section
      aria-labelledby="mind-move-heading"
      className={`card clue-in flex flex-col gap-4 p-5 sm:p-6 ${isGuess ? 'border-gold-fill' : ''}`}
    >
      <p className="eyebrow">{isGuess ? 'My guess' : `Question ${number}`}</p>
      {isGuess ? (
        <div>
          <h3 id="mind-move-heading" className="text-lg font-semibold text-muted">
            Is your player&hellip;
          </h3>
          <p className="pop mt-1 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            {move.player.name}?
          </p>
          <p className="mt-1 text-sm font-medium text-muted">
            {move.player.country} · {move.player.role}
          </p>
        </div>
      ) : (
        <h3
          id="mind-move-heading"
          className="text-xl leading-snug font-bold tracking-tight sm:text-2xl"
        >
          {move.question.text}
        </h3>
      )}

      {isGuess ? (
        <div className="flex gap-2">
          <button
            ref={firstButton}
            type="button"
            className="btn btn-primary flex-1 text-base"
            onClick={() => onGuessResponse(true)}
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            Yes, that&rsquo;s right
          </button>
          <button
            type="button"
            className="btn btn-ghost flex-1 text-base"
            onClick={() => onGuessResponse(false)}
          >
            <X className="h-5 w-5 text-danger" aria-hidden="true" />
            No
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            ref={firstButton}
            type="button"
            className="btn btn-primary text-base"
            onClick={() => onAnswer('yes')}
            aria-keyshortcuts="Y"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            Yes
          </button>
          <button
            type="button"
            className="btn btn-ghost text-base"
            onClick={() => onAnswer('no')}
            aria-keyshortcuts="N"
          >
            <X className="h-5 w-5 text-danger" aria-hidden="true" />
            No
          </button>
          <button
            type="button"
            className="btn btn-ghost px-2 text-base whitespace-nowrap"
            onClick={() => onAnswer('unsure')}
            aria-keyshortcuts="?"
          >
            <CircleHelp className="hidden h-5 w-5 text-gold min-[400px]:block" aria-hidden="true" />
            Not sure
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="hidden sm:inline">
          Keyboard: <kbd className="font-bold">Y</kbd> yes · <kbd className="font-bold">N</kbd> no
          {!isGuess && (
            <>
              {' '}
              · <kbd className="font-bold">?</kbd> not sure
            </>
          )}
        </span>
        <button
          type="button"
          onClick={onGiveUp}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold hover:text-ink focus-visible:outline-3 focus-visible:outline-gold-fill"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          End round
        </button>
      </div>
    </section>
  )
}
