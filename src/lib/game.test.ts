import { describe, expect, it } from 'vitest'
import { makePlayer } from '../test/fixtures'
import { describeCell, formatValue } from './format'
import { compare } from './compare'
import { newGame, sanitizeGame, submitGuess } from './game'

describe('submitGuess', () => {
  it('adds a guess and keeps playing', () => {
    const g = submitGuess(newGame(1), 'a', 'z', 8)
    expect(g).toEqual({ puzzleNumber: 1, guesses: ['a'], status: 'playing' })
  })

  it('wins on the answer', () => {
    expect(submitGuess(newGame(1), 'z', 'z', 8).status).toBe('won')
  })

  it('loses after the last guess', () => {
    let g = newGame(1)
    for (const id of ['a', 'b', 'c']) g = submitGuess(g, id, 'z', 3)
    expect(g.status).toBe('lost')
  })

  it('wins on the last guess rather than losing', () => {
    let g = newGame(1)
    for (const id of ['a', 'b', 'z']) g = submitGuess(g, id, 'z', 3)
    expect(g.status).toBe('won')
  })

  it('ignores repeats and guesses after the game ends', () => {
    const g = submitGuess(newGame(1), 'a', 'z', 8)
    expect(submitGuess(g, 'a', 'z', 8)).toBe(g)
    const won = submitGuess(g, 'z', 'z', 8)
    expect(submitGuess(won, 'b', 'z', 8)).toBe(won)
  })
})

describe('sanitizeGame', () => {
  const known = (id: string) => id !== 'gone'

  it('drops unknown and duplicate ids and recomputes status', () => {
    const g = sanitizeGame(
      { puzzleNumber: 3, guesses: ['a', 'gone', 'a', 'b'], status: 'won' },
      'z',
      known,
      8,
    )
    expect(g).toEqual({ puzzleNumber: 3, guesses: ['a', 'b'], status: 'playing' })
  })

  it('ignores guesses after a win and caps at max guesses', () => {
    expect(
      sanitizeGame({ puzzleNumber: 1, guesses: ['z', 'a'], status: 'playing' }, 'z', known, 8),
    ).toEqual({ puzzleNumber: 1, guesses: ['z'], status: 'won' })
    const g = sanitizeGame(
      { puzzleNumber: 1, guesses: ['a', 'b', 'c', 'd'], status: 'playing' },
      'z',
      known,
      3,
    )
    expect(g.guesses).toHaveLength(3)
    expect(g.status).toBe('lost')
  })
})

describe('formatValue', () => {
  it('abbreviates values for compact cells', () => {
    expect(formatValue({ key: 'country', value: 'New Zealand' })).toEqual({
      short: 'NZ',
      full: 'New Zealand',
    })
    expect(formatValue({ key: 'role', value: 'Wicketkeeper-Batter' }).short).toBe('WK')
    expect(formatValue({ key: 'battingHand', value: 'Left' }).short).toBe('LHB')
    expect(formatValue({ key: 'bowlingType', value: 'Left-arm orthodox' }).short).toBe('SLA')
    expect(formatValue({ key: 'bowlingType', value: 'None' }).full).toBe('Does not bowl')
    expect(formatValue({ key: 'active', value: false }).short).toBe('Retired')
    expect(formatValue({ key: 'intlMatches', value: 450 }).short).toBe('450')
  })

  it('describes cells for screen readers, including direction', () => {
    const answer = makePlayer({ debutYear: 2010, intlMatches: 300 })
    const guess = makePlayer({ id: 'g', debutYear: 2008, intlMatches: 400 })
    const [, , , , debut, matches] = compare(guess, answer).cells
    expect(describeCell(debut!)).toBe('Debut year: Debut 2008, close, answer is later')
    expect(describeCell(matches!)).toBe(
      'International matches: 400 international matches, not a match, answer is fewer',
    )
  })
})
