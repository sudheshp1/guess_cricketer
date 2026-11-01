import type { CSSProperties } from 'react'
import { describeCell, formatValue } from '../lib/format'
import type { CellFeedback, Match } from '../types'

const COLORS: Record<Match, string> = {
  correct: 'bg-correct text-white',
  close: 'bg-close text-gray-900',
  wrong: 'bg-wrong text-white',
}

interface Props {
  cell: CellFeedback
  /** Animate the cell flipping in after this many ms; undefined renders it already revealed. */
  revealDelayMs?: number
}

export function FeedbackCell({ cell, revealDelayMs }: Props) {
  const { short, full } = formatValue(cell)
  const animate = revealDelayMs !== undefined
  const style: CSSProperties | undefined = animate
    ? { animationDelay: `${revealDelayMs}ms` }
    : undefined
  return (
    <div
      title={full}
      style={style}
      className={`flex aspect-square min-w-0 flex-col sm:aspect-auto sm:h-16 items-center justify-center rounded-md px-0.5 text-center leading-tight font-semibold ${COLORS[cell.match]} ${animate ? 'cell-flip' : ''}`}
      data-match={cell.match}
    >
      <span className="sr-only">{describeCell(cell)}</span>
      <span className="text-[11px] sm:text-sm" aria-hidden="true">
        {short}
      </span>
      {cell.direction && (
        <span className="text-sm leading-none sm:text-base" aria-hidden="true">
          {cell.direction === 'up' ? '↑' : '↓'}
        </span>
      )}
    </div>
  )
}
