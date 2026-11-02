import { Brain, Flag, Lightbulb } from 'lucide-react'
import { MAX_CLUES, MIND_MAX_GUESSES, MIND_MAX_QUESTIONS } from '../config'
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

        <section
          aria-labelledby="mind-help-heading"
          className="rounded-2xl border border-line bg-surface-2 p-4"
        >
          <h3 id="mind-help-heading" className="flex items-center gap-2 font-bold">
            <Brain className="h-4.5 w-4.5 text-brand" aria-hidden="true" />
            Mind Reader mode
          </h3>
          <p className="mt-1.5 text-sm">
            Swap roles: <strong>you</strong> think of a cricketer and I ask up to{' '}
            {MIND_MAX_QUESTIONS} yes/no questions, then name them in {MIND_MAX_GUESSES} guesses or
            fewer. Answer <strong>Not sure</strong> when you don&apos;t know. One wrong answer
            won&apos;t always throw me off.
          </p>
          <ol className="mt-2.5 space-y-1 text-sm text-muted" aria-label="Example round">
            <li>
              <span className="font-semibold text-ink">Does your player bowl spin?</span> No
            </li>
            <li>
              <span className="font-semibold text-ink">Is your player from an Asian team?</span> Yes
            </li>
            <li>&hellip;</li>
            <li>
              <span className="font-semibold text-ink">Is your player Virat Kohli?</span> Yes,
              that&apos;s right!
            </li>
          </ol>
        </section>

        <p className="text-xs text-muted">
          Player details come from Wikipedia and Cricsheet. Career figures are as of the date shown
          on each clue, so very recent matches may be missing.
        </p>
      </div>
    </Modal>
  )
}
