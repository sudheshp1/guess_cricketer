import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makePlayer } from '../test/fixtures'
import type { Round } from '../types'
import { RoundResult } from './RoundResult'

const round: Round = {
  roundId: 'r1',
  answerId: 'answer',
  guesses: ['answer'],
  cluesRevealed: 3,
  status: 'won',
  gaveUp: false,
}

describe('RoundResult', () => {
  it("links to the answer's Wikipedia article in a new tab", () => {
    const answer = makePlayer({ name: 'Steve Smith', wikipedia: 'Steve Smith (cricketer)' })
    render(<RoundResult round={round} answer={answer} onNext={vi.fn()} onShare={vi.fn()} />)
    const link = screen.getByRole('link', { name: /read about steve smith on wikipedia/i })
    expect(link).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Steve_Smith_(cricketer)')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows the link after a loss too', () => {
    render(
      <RoundResult
        round={{ ...round, status: 'lost', gaveUp: true }}
        answer={makePlayer()}
        onNext={vi.fn()}
        onShare={vi.fn()}
      />,
    )
    expect(screen.getByRole('link', { name: /on wikipedia/i })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Answer_Player',
    )
  })
})
