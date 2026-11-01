import { Flag, Lightbulb } from 'lucide-react'
import { MAX_CLUES } from '../config'
import type { ClueKey } from '../types'
import { CLUE_ICONS } from './clueIcons'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  animate?: boolean
}

const CLUE_ORDER: [ClueKey, string][] = [
  ['role', 'Role'],
  ['country', 'Country'],
  ['style', 'Batting & bowling style'],
  ['debut', 'Debut year'],
  ['status', 'Active or retired'],
  ['matches', 'Matches by format'],
  ['batting', 'Runs & top score'],
  ['bowling', 'Wickets & best figures'],
  ['milestones', '100s & 50s'],
  ['initials', 'Shape of the name'],
]

export function HowToPlayModal({ open, onClose, animate }: Props) {
  return (
    <Modal title="How to play" open={open} onClose={onClose} animate={animate}>
      <div className="space-y-4 text-[15px] leading-relaxed">
        <p>
          Name the mystery international cricketer. You start with <strong>one clue</strong>; every
          wrong guess unlocks the next. Solve it in as few of the {MAX_CLUES} clues as you can, then
          play the next player. There&apos;s no limit.
        </p>

        <section aria-labelledby="clue-order-heading">
          <h3 id="clue-order-heading" className="eyebrow mb-2">
            Clues, vaguest first
          </h3>
          <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {CLUE_ORDER.map(([key, label], i) => {
              const Icon = CLUE_ICONS[key]
              return (
                <li
                  key={key}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"
                >
                  <span className="w-4 text-right font-bold text-muted tabular-nums">{i + 1}</span>
                  <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span className="font-medium">{label}</span>
                </li>
              )
            })}
          </ol>
        </section>

        <ul className="space-y-2 text-sm">
          <li className="flex gap-2.5">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span>
              Stuck? <strong>Another clue</strong> reveals the next one without guessing.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span>
              <strong>Give up</strong> shows the answer. Use <strong>Mystery player pool</strong> to
              choose famous names only, regular fans&apos; level, or everyone.
            </span>
          </li>
        </ul>

        <p className="text-xs text-muted">
          Player details come from Wikipedia and Cricsheet. Career figures are as of the date shown
          on each clue, so very recent matches may be missing.
        </p>
      </div>
    </Modal>
  )
}
