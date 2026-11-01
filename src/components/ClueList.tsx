import { Lock } from 'lucide-react'
import type { Clue } from '../types'
import { CLUE_ICONS } from './clueIcons'

interface Props {
  clues: readonly Clue[]
  /** Index of the first clue to show (for the "other clues" list after a round). */
  from?: number
  /** Show clues up to (not including) this index. */
  to: number
  /** Highlight the last visible clue as the newest one. */
  highlightLatest?: boolean
  /** Show the clues after `to` as locked tiles. */
  showLocked?: boolean
  label?: string
}

/** Clue cards with an icon per clue type; locked clues appear as dimmed tiles. */
export function ClueList({
  clues,
  from = 0,
  to,
  highlightLatest = false,
  showLocked = false,
  label = 'Clues',
}: Props) {
  const lockedClues = clues.slice(to)
  return (
    <ol className="grid grid-cols-1 gap-2.5 sm:gap-3 2xl:grid-cols-2" aria-label={label}>
      {clues.slice(from, to).map((clue, offset) => {
        const i = from + offset
        const latest = highlightLatest && i === to - 1
        const Icon = CLUE_ICONS[clue.key]
        return (
          <li
            key={clue.key}
            className={`clue-in flex gap-3.5 rounded-2xl border bg-surface p-3.5 sm:gap-4 sm:p-4 ${
              latest ? 'clue-latest border-gold-fill' : 'border-line shadow-(--shadow)'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                latest ? 'bg-gold-soft text-gold' : 'bg-brand-soft text-brand'
              }`}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">
                <span className="tabular-nums">Clue {i + 1}</span> · {clue.title}
              </p>
              <p
                className={`mt-0.5 text-base leading-snug font-semibold sm:text-lg ${
                  clue.key === 'initials' ? 'font-mono tracking-[0.2em]' : ''
                }`}
              >
                {clue.text}
              </p>
              {clue.note && <p className="mt-1 text-xs text-muted">{clue.note}</p>}
            </div>
          </li>
        )
      })}
      {showLocked && lockedClues.length > 0 && (
        <li className="col-span-full mt-1">
          <p className="eyebrow mb-2">
            {lockedClues.length} more {lockedClues.length === 1 ? 'clue' : 'clues'} locked
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" aria-hidden="true">
            {lockedClues.map((clue, offset) => (
              <div
                key={clue.key}
                className="flex items-center gap-2 rounded-xl border border-dashed border-line-strong px-3 py-2 text-sm text-muted"
              >
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="tabular-nums">{to + offset + 1}</span>
                <span className="truncate">{clue.title}</span>
              </div>
            ))}
          </div>
        </li>
      )}
    </ol>
  )
}
