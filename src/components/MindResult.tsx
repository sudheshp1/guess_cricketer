import { RotateCcw, Share2 } from 'lucide-react'
import type { MindRound, Mismatch } from '../lib/mind'
import { PLAYERS } from '../lib/players'
import type { Player } from '../types'
import { GuessInput } from './GuessInput'

interface Props {
  round: MindRound
  questionsAsked: number
  /** The player the game guessed correctly (on a win). */
  guessed: Player | null
  revealed: Player | null
  mismatches: readonly Mismatch[]
  onReveal: (playerId: string) => void
  onPlayAgain: () => void
  onShare?: () => void
}

/** End of a Mind Reader round: the game's win, or "you beat me" with a reveal. */
export function MindResult({
  round,
  questionsAsked,
  guessed,
  revealed,
  mismatches,
  onReveal,
  onPlayAgain,
  onShare,
}: Props) {
  const won = round.status === 'won'
  const actions = (
    <div className="relative mt-5 flex gap-2">
      <button
        type="button"
        onClick={onPlayAgain}
        autoFocus={won || revealed !== null}
        className="btn btn-primary flex-1 text-base"
      >
        <RotateCcw className="h-5 w-5" aria-hidden="true" />
        Play again
      </button>
      {onShare && (
        <button type="button" onClick={onShare} className="btn btn-ghost">
          <Share2 className="h-4.5 w-4.5" aria-hidden="true" />
          Share
        </button>
      )}
    </div>
  )

  if (won) {
    return (
      <section
        aria-labelledby="mind-result-heading"
        className="relative overflow-hidden rounded-2xl border border-brand bg-brand-soft p-5"
      >
        <h2
          id="mind-result-heading"
          className="text-sm font-bold tracking-wide text-brand uppercase"
        >
          {questionsAsked === 1
            ? 'Got it in 1 question!'
            : `Got it in ${questionsAsked} questions!`}
        </h2>
        <p className="mt-2 text-muted">You were thinking of</p>
        <p className="pop">
          <strong className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            {guessed?.name}
          </strong>
        </p>
        {actions}
      </section>
    )
  }

  return (
    <section
      aria-labelledby="mind-result-heading"
      className="rounded-2xl border border-line bg-surface-2 p-5"
    >
      <h2 id="mind-result-heading" className="text-sm font-bold tracking-wide text-muted uppercase">
        You beat me!
      </h2>
      {revealed ? (
        <>
          <p className="mt-2 text-muted">You were thinking of</p>
          <p className="pop">
            <strong className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
              {revealed.name}
            </strong>
          </p>
          {mismatches.length > 0 ? (
            <div className="mt-3 text-sm">
              <p className="font-semibold">
                {mismatches.length === 1
                  ? 'One answer didn’t match my data:'
                  : `${mismatches.length} answers didn’t match my data:`}
              </p>
              <ul className="mt-1.5 flex flex-col gap-1 text-muted">
                {mismatches.map((m) => (
                  <li key={m.question.id}>
                    {m.question.text} You said <strong className="text-ink">{m.said}</strong>, my
                    data says{' '}
                    <strong className="text-ink">{m.said === 'yes' ? 'no' : 'yes'}</strong>.
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Every answer matched my data. I just ran out of questions!
            </p>
          )}
          {actions}
        </>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-muted">Who were you thinking of?</p>
          <GuessInput
            players={PLAYERS}
            guessedIds={[]}
            placeholder="Type your player's name"
            autoFocus
            onGuess={onReveal}
          />
          <button type="button" onClick={onPlayAgain} className="btn btn-ghost self-start">
            <RotateCcw className="h-4.5 w-4.5" aria-hidden="true" />
            Skip and play again
          </button>
        </div>
      )}
    </section>
  )
}
