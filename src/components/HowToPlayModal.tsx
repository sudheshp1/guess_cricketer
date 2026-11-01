import { MAX_CLUES } from '../config'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  animate?: boolean
}

const CLUE_ORDER = [
  'Role (batter, bowler, all-rounder, wicketkeeper)',
  'Country',
  'Batting hand and bowling style',
  'International debut year',
  'Still playing, or when they retired',
  'International matches (Tests, ODIs, T20Is)',
  'Runs and highest score',
  'Wickets and best bowling',
  'Hundreds and fifties',
  'The shape of their name',
]

export function HowToPlayModal({ open, onClose, animate }: Props) {
  return (
    <Modal title="How to play" open={open} onClose={onClose} animate={animate}>
      <div className="space-y-3 text-sm">
        <p>
          Guess the mystery international cricketer. You start with one clue; every wrong guess
          unlocks the next one. Solve it in as few clues as you can. There are {MAX_CLUES} clues in
          all.
        </p>
        <p>
          Stuck? Tap <strong>Another clue</strong> to reveal the next one without guessing, or{' '}
          <strong>Give up</strong> to see the answer. Then hit <strong>Next player</strong> and keep
          going: there's no limit.
        </p>
        <section aria-labelledby="clue-order-heading">
          <h3 id="clue-order-heading" className="font-semibold">
            Clues, in order
          </h3>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">
            {CLUE_ORDER.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </section>
        <p>
          Use <strong>Players</strong> to choose how obscure the mystery players can be: household
          names only, players regular fans know, or everyone.
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Player details come from Wikipedia and Cricsheet. Career figures are as of the date shown
          on each clue, so very recent matches may be missing.
        </p>
      </div>
    </Modal>
  )
}
