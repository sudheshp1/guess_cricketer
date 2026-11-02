import { Check, X } from 'lucide-react'
import type { MindHistoryItem } from '../hooks/useMindReader'
import type { MindAnswer } from '../types'

const ANSWER_TEXT: Record<MindAnswer, string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' }

const ANSWER_STYLE: Record<MindAnswer, string> = {
  yes: 'bg-brand-soft text-brand',
  no: 'bg-surface-2 text-ink border border-line',
  unsure: 'bg-gold-soft text-gold',
}

/** The questions and guesses so far, oldest first. */
export function MindHistory({ items }: { items: readonly MindHistoryItem[] }) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby="mind-history-heading" className="card p-4 sm:p-5">
      <h3 id="mind-history-heading" className="eyebrow mb-2.5">
        So far
      </h3>
      <ol className="flex flex-col divide-y divide-line">
        {items.map((item, i) => (
          <li key={`${item.kind}-${item.id}`} className="flex items-start gap-3 py-2 text-sm">
            <span className="w-5 shrink-0 pt-0.5 text-right text-xs font-bold text-muted tabular-nums">
              {i + 1}
            </span>
            {item.kind === 'question' ? (
              <>
                <span className="min-w-0 flex-1">{item.text}</span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${ANSWER_STYLE[item.answer]}`}
                >
                  {ANSWER_TEXT[item.answer]}
                </span>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1">
                  Is it <strong>{item.player.name}</strong>?
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    item.correct ? 'bg-brand text-on-brand' : 'border border-line bg-surface-2'
                  }`}
                >
                  {item.correct ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-danger" aria-hidden="true" />
                  )}
                  {item.correct ? 'Yes' : 'No'}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
