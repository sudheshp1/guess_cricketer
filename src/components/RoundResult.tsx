import { ArrowRight, ExternalLink, Share2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { MAX_CLUES } from '../config'
import { wikipediaUrl } from '../lib/wikipedia'
import type { Player, Round } from '../types'

interface Props {
  round: Round
  answer: Player
  onNext: () => void
  onShare: () => void
}

const CONFETTI_COLORS = ['#22c55e', '#fbbf24', '#ef4444', '#38bdf8', '#f472b6', '#ffffff']

/** A short, deterministic confetti burst (hidden under reduced motion). */
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2
        const distance = 110 + (i % 4) * 30
        const style = {
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          '--dx': `${Math.cos(angle) * distance}px`,
          '--dy': `${Math.sin(angle) * distance * 0.7 + 40}px`,
          '--rot': `${(i % 2 ? 1 : -1) * (180 + i * 25)}deg`,
          animationDelay: `${(i % 5) * 25}ms`,
        } as CSSProperties
        return <span key={i} className="confetti-piece" style={style} />
      })}
    </div>
  )
}

function total(player: Player, key: 'runs' | 'wickets'): string {
  const values = Object.values(player.stats).map((s) => s[key])
  if (values.every((v) => v === null)) return '–'
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0).toLocaleString('en-US')
}

/** Shown when a round ends: the answer, a mini scorecard, and next/share actions. */
export function RoundResult({ round, answer, onNext, onShare }: Props) {
  const won = round.status === 'won'
  const heading = won
    ? round.cluesRevealed === 1
      ? 'Got it on the first clue!'
      : `Got it on clue ${round.cluesRevealed} of ${MAX_CLUES}`
    : round.gaveUp
      ? 'You gave up'
      : 'Out of clues'
  const scorecard = [
    { label: 'Matches', value: answer.intlMatches.toLocaleString('en-US') },
    { label: 'Runs', value: total(answer, 'runs') },
    { label: 'Wickets', value: total(answer, 'wickets') },
  ]

  return (
    <section
      aria-labelledby="round-result-heading"
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        won ? 'border-brand bg-brand-soft' : 'border-line bg-surface-2'
      }`}
    >
      {won && <Confetti />}
      <h2
        id="round-result-heading"
        className={`relative text-sm font-bold tracking-wide uppercase ${won ? 'text-brand' : 'text-muted'}`}
      >
        {heading}
      </h2>
      <p className="relative mt-2 text-muted">The player was</p>
      <p className="relative pop">
        <strong className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          {answer.name}
        </strong>
      </p>
      <p className="relative mt-1 text-sm font-medium text-muted">
        {answer.country} · {answer.role} · {answer.active ? 'Active' : 'Retired'}
      </p>

      <dl className="relative mt-4 grid grid-cols-3 gap-2">
        {scorecard.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-center"
          >
            <dt className="eyebrow">{s.label}</dt>
            <dd className="text-lg font-extrabold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <a
        href={wikipediaUrl(answer)}
        target="_blank"
        rel="noopener noreferrer"
        className="relative mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline"
      >
        Read about {answer.name} on Wikipedia
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>

      <div className="relative mt-5 flex gap-2">
        <button
          type="button"
          onClick={onNext}
          autoFocus
          className="btn btn-primary flex-1 text-base"
        >
          Next player
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={onShare} className="btn btn-ghost">
          <Share2 className="h-4.5 w-4.5" aria-hidden="true" />
          Share
        </button>
      </div>
    </section>
  )
}
