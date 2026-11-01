import { DEBUT_YEAR_CLOSE_RANGE, INTL_MATCHES_CLOSE_RANGE, MAX_GUESSES } from '../config'
import { compare } from '../lib/compare'
import { BOWLING_CODES, COLUMN_LABELS, ROLE_CODES } from '../lib/format'
import type { Player } from '../types'
import { FeedbackCell } from './FeedbackCell'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  /** Two real players for the worked example (guess, then answer). */
  example: [Player, Player] | null
  animate?: boolean
}

export function HowToPlayModal({ open, onClose, example, animate }: Props) {
  const exampleResult = example ? compare(example[0], example[1]) : null
  return (
    <Modal title="How to play" open={open} onClose={onClose} animate={animate}>
      <div className="space-y-3 text-sm">
        <p>
          Guess the mystery international cricketer in {MAX_GUESSES} tries. Everyone gets the same
          player, and a new one arrives every day at midnight IST.
        </p>
        <p>
          Type a name and pick from the list. Each guess shows how the player you picked compares
          with the answer:
        </p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 shrink-0 rounded bg-correct" aria-hidden="true" />
            <span>
              <strong>Green</strong>: exact match.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 shrink-0 rounded bg-close" aria-hidden="true" />
            <span>
              <strong>Amber</strong>: close. Related role, same bowling family (pace or spin), debut
              within ±{DEBUT_YEAR_CLOSE_RANGE} years, or within ±{INTL_MATCHES_CLOSE_RANGE}{' '}
              international matches.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 shrink-0 rounded bg-wrong" aria-hidden="true" />
            <span>
              <strong>Grey</strong>: not a match.
            </span>
          </li>
          <li>
            <strong>↑ / ↓</strong>: the answer's debut year or match count is higher / lower than
            your guess.
          </li>
        </ul>

        {example && exampleResult && (
          <section aria-labelledby="example-heading">
            <h3 id="example-heading" className="mt-4 font-semibold">
              Example
            </h3>
            <p className="mt-1">
              If the answer were <strong>{example[1].name}</strong> and you guessed{' '}
              <strong>{example[0].name}</strong>:
            </p>
            <div className="mt-2 grid grid-cols-7 gap-1" aria-hidden="true">
              {exampleResult.cells.map((c) => (
                <div
                  key={c.key}
                  className="text-center text-[10px] font-semibold text-gray-600 uppercase dark:text-gray-400"
                >
                  {COLUMN_LABELS[c.key].short}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {exampleResult.cells.map((c) => (
                <FeedbackCell key={c.key} cell={c} />
              ))}
            </div>
          </section>
        )}

        <details className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <summary className="cursor-pointer font-semibold">Abbreviations</summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            {Object.entries(ROLE_CODES).map(([full, code]) => (
              <Abbr key={code} code={code} full={full} />
            ))}
            <Abbr code="RHB / LHB" full="Right- / left-handed batter" />
            {Object.entries(BOWLING_CODES).map(([full, code]) => (
              <Abbr key={full} code={code} full={full === 'None' ? 'Does not bowl' : full} />
            ))}
            <Abbr code="Mat" full="International matches (Tests + ODIs + T20Is)" />
            <Abbr code="Status" full="Active, or retired from international cricket" />
          </dl>
        </details>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Player details come from Wikipedia and Cricsheet; match counts are updated when the player
          list is rebuilt, so very recent matches may be missing.
        </p>
      </div>
    </Modal>
  )
}

function Abbr({ code, full }: { code: string; full: string }) {
  return (
    <>
      <dt className="font-mono font-semibold">{code}</dt>
      <dd>{full}</dd>
    </>
  )
}
