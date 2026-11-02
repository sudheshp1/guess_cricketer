import { Brain, Search } from 'lucide-react'
import type { GameMode } from '../types'

interface Props {
  mode: GameMode
  onChange: (mode: GameMode) => void
}

const MODES: { value: GameMode; label: string; short: string; Icon: typeof Brain }[] = [
  { value: 'clues', label: 'Guess the player', short: 'Guess', Icon: Search },
  { value: 'mind', label: 'Mind Reader', short: 'Mind Reader', Icon: Brain },
]

/** Segmented control to switch between the two games. Each keeps its own round. */
export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Game mode"
      className="flex w-full rounded-full border border-line bg-surface p-1 shadow-(--shadow) sm:w-auto sm:self-start"
    >
      {MODES.map(({ value, label, short, Icon }) => {
        const active = value === mode
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => onChange(value)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap sm:px-4 transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold-fill sm:flex-none ${
              active ? 'bg-brand text-on-brand' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span aria-hidden="true" className="sm:hidden">
              {short}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
