import { describe, expect, it } from 'vitest'
import { makePlayer } from '../test/fixtures'
import type { AttributeKey, BowlingType, CellFeedback, Role } from '../types'
import { bowlingFamily, compare, compareBowling, compareNumber, compareRole } from './compare'

const answer = makePlayer()
const cell = (key: AttributeKey, guess = makePlayer({ id: 'guess' })): CellFeedback =>
  compare(guess, answer).cells.find((c) => c.key === key)!

describe('compare', () => {
  it('returns one cell per attribute in display order', () => {
    expect(compare(makePlayer({ id: 'guess' }), answer).cells.map((c) => c.key)).toEqual([
      'country',
      'role',
      'battingHand',
      'bowlingType',
      'debutYear',
      'intlMatches',
      'active',
    ])
  })

  it('marks the correct player as correct, with every cell green and no arrows', () => {
    const result = compare(answer, answer)
    expect(result.isCorrect).toBe(true)
    expect(result.playerId).toBe('answer')
    expect(result.cells.every((c) => c.match === 'correct' && c.direction === null)).toBe(true)
  })

  it('is not correct for a different player with identical attributes', () => {
    expect(compare(makePlayer({ id: 'twin' }), answer).isCorrect).toBe(false)
  })

  it("shows the guessed player's values, not the answer's", () => {
    const guess = makePlayer({
      id: 'g',
      country: 'Australia',
      debutYear: 1999,
      intlMatches: 12,
      active: false,
    })
    const values = Object.fromEntries(compare(guess, answer).cells.map((c) => [c.key, c.value]))
    expect(values).toMatchObject({
      country: 'Australia',
      debutYear: 1999,
      intlMatches: 12,
      active: false,
    })
  })

  describe('country', () => {
    it('is green on exact match, grey otherwise (never amber)', () => {
      expect(cell('country').match).toBe('correct')
      expect(cell('country', makePlayer({ id: 'g', country: 'Pakistan' })).match).toBe('wrong')
    })
  })

  describe('batting hand', () => {
    it('is green or grey', () => {
      expect(cell('battingHand').match).toBe('correct')
      expect(cell('battingHand', makePlayer({ id: 'g', battingHand: 'Left' })).match).toBe('wrong')
    })
  })

  describe('active status', () => {
    it('is green or grey', () => {
      expect(cell('active').match).toBe('correct')
      expect(cell('active', makePlayer({ id: 'g', active: false })).match).toBe('wrong')
    })
  })

  describe('role', () => {
    it.each<[Role, Role, string]>([
      ['Batter', 'Batter', 'correct'],
      ['Batter', 'Wicketkeeper-Batter', 'close'],
      ['Wicketkeeper-Batter', 'Batter', 'close'],
      ['All-rounder', 'Batter', 'close'],
      ['Batter', 'All-rounder', 'close'],
      ['All-rounder', 'Bowler', 'close'],
      ['Bowler', 'All-rounder', 'close'],
      ['Bowler', 'Batter', 'wrong'],
      ['Batter', 'Bowler', 'wrong'],
      ['Wicketkeeper-Batter', 'Bowler', 'wrong'],
      ['Wicketkeeper-Batter', 'All-rounder', 'wrong'],
      ['All-rounder', 'Wicketkeeper-Batter', 'wrong'],
    ])('guess %s vs answer %s -> %s', (guess, ans, expected) => {
      expect(compareRole(guess, ans)).toBe(expected)
    })

    it('is used by compare()', () => {
      const a = makePlayer({ role: 'Bowler' })
      const g = makePlayer({ id: 'g', role: 'All-rounder' })
      expect(compare(g, a).cells[1]).toMatchObject({ key: 'role', match: 'close' })
    })
  })

  describe('bowling type', () => {
    it.each<[BowlingType, BowlingType, string]>([
      ['Right-arm fast', 'Right-arm fast', 'correct'],
      ['Right-arm fast', 'Left-arm medium', 'close'],
      ['Right-arm medium', 'Left-arm fast', 'close'],
      ['Right-arm off-spin', 'Left-arm wrist-spin', 'close'],
      ['Left-arm orthodox', 'Right-arm leg-spin', 'close'],
      ['Right-arm fast', 'Right-arm off-spin', 'wrong'],
      ['Left-arm orthodox', 'Left-arm medium', 'wrong'],
      ['None', 'None', 'correct'],
      ['None', 'Right-arm fast', 'wrong'],
      ['Right-arm leg-spin', 'None', 'wrong'],
    ])('guess %s vs answer %s -> %s', (guess, ans, expected) => {
      expect(compareBowling(guess, ans)).toBe(expected)
    })

    it('groups types into families', () => {
      expect(bowlingFamily('Left-arm fast')).toBe('pace')
      expect(bowlingFamily('Left-arm wrist-spin')).toBe('spin')
      expect(bowlingFamily('None')).toBe('none')
    })
  })

  describe('debut year (±3 is close)', () => {
    const debut = (guessYear: number) =>
      cell('debutYear', makePlayer({ id: 'g', debutYear: guessYear }))

    it('is green with no arrow on exact match', () => {
      expect(debut(2010)).toMatchObject({ match: 'correct', direction: null })
    })

    it('is amber within 3 years, at both edges', () => {
      expect(debut(2007)).toMatchObject({ match: 'close', direction: 'up' })
      expect(debut(2013)).toMatchObject({ match: 'close', direction: 'down' })
      expect(debut(2009)).toMatchObject({ match: 'close', direction: 'up' })
    })

    it('is grey beyond 3 years, with an arrow', () => {
      expect(debut(2006)).toMatchObject({ match: 'wrong', direction: 'up' })
      expect(debut(2014)).toMatchObject({ match: 'wrong', direction: 'down' })
    })
  })

  describe('international matches (±25 is close)', () => {
    const matches = (n: number) => cell('intlMatches', makePlayer({ id: 'g', intlMatches: n }))

    it('is green with no arrow on exact match', () => {
      expect(matches(300)).toMatchObject({ match: 'correct', direction: null })
    })

    it('is amber within 25, at both edges', () => {
      expect(matches(275)).toMatchObject({ match: 'close', direction: 'up' })
      expect(matches(325)).toMatchObject({ match: 'close', direction: 'down' })
    })

    it('is grey beyond 25', () => {
      expect(matches(274)).toMatchObject({ match: 'wrong', direction: 'up' })
      expect(matches(326)).toMatchObject({ match: 'wrong', direction: 'down' })
    })
  })

  describe('arrows', () => {
    it('point up when the answer is higher than the guess', () => {
      expect(compareNumber(10, 20, 3).direction).toBe('up')
    })
    it('point down when the answer is lower than the guess', () => {
      expect(compareNumber(20, 10, 3).direction).toBe('down')
    })
    it('are absent on non-numeric cells', () => {
      const g = makePlayer({ id: 'g', country: 'England', role: 'Bowler' })
      for (const c of compare(g, answer).cells.filter(
        (c) => c.key !== 'debutYear' && c.key !== 'intlMatches',
      )) {
        expect(c.direction).toBeNull()
      }
    })
  })
})
