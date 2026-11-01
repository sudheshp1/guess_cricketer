import { describe, expect, it } from 'vitest'
import { makePlayer } from '../test/fixtures'
import { giveUp, guess, isValidRound, newRound, pickAnswer, revealClue } from './round'

const players = [
  makePlayer({ id: 'famous', difficulty: 1 }),
  makePlayer({ id: 'regular', difficulty: 2 }),
  makePlayer({ id: 'deep-cut', difficulty: 3 }),
]

describe('pickAnswer', () => {
  it('only picks from the chosen pool', () => {
    for (let i = 0; i < 10; i++) {
      const r = () => i / 10
      expect(pickAnswer(players, 'famous', [], r).id).toBe('famous')
      expect(['famous', 'regular']).toContain(pickAnswer(players, 'regular', [], r).id)
    }
    expect(pickAnswer(players, 'all', [], () => 0.99).id).toBe('deep-cut')
  })

  it('avoids recent answers when possible', () => {
    expect(pickAnswer(players, 'regular', ['famous'], () => 0).id).toBe('regular')
    // Everything in the pool is recent: fall back to the whole pool.
    expect(pickAnswer(players, 'famous', ['famous'], () => 0).id).toBe('famous')
  })

  it('throws for an empty pool', () => {
    expect(() => pickAnswer([], 'all', [])).toThrow()
  })
})

describe('round', () => {
  it('starts with one clue showing', () => {
    expect(newRound('x', 'r1')).toEqual({
      roundId: 'r1',
      answerId: 'x',
      guesses: [],
      cluesRevealed: 1,
      status: 'playing',
      gaveUp: false,
    })
  })

  it('reveals the next clue on a wrong guess', () => {
    const r = guess(newRound('x', 'r1'), 'a', 10)
    expect(r).toMatchObject({ guesses: ['a'], cluesRevealed: 2, status: 'playing' })
  })

  it('wins on the answer without revealing more', () => {
    const r = guess(guess(newRound('x', 'r1'), 'a', 10), 'x', 10)
    expect(r).toMatchObject({ status: 'won', cluesRevealed: 2, guesses: ['a', 'x'] })
  })

  it('loses on a wrong guess when every clue is showing', () => {
    let r = newRound('x', 'r1')
    r = guess(r, 'a', 3) // clue 2
    r = guess(r, 'b', 3) // clue 3
    expect(r.status).toBe('playing')
    r = guess(r, 'c', 3)
    expect(r).toMatchObject({ status: 'lost', cluesRevealed: 3, gaveUp: false })
  })

  it('can still win with the last guess', () => {
    let r = newRound('x', 'r1')
    r = guess(r, 'a', 2)
    r = guess(r, 'x', 2)
    expect(r.status).toBe('won')
  })

  it('ignores repeats and guesses after the round ends', () => {
    const r = guess(newRound('x', 'r1'), 'a', 10)
    expect(guess(r, 'a', 10)).toBe(r)
    const won = guess(r, 'x', 10)
    expect(guess(won, 'b', 10)).toBe(won)
  })

  it('reveals clues without guessing, up to the maximum', () => {
    let r = newRound('x', 'r1')
    r = revealClue(r, 3)
    r = revealClue(r, 3)
    expect(r.cluesRevealed).toBe(3)
    expect(revealClue(r, 3)).toBe(r)
    expect(r.guesses).toEqual([])
  })

  it('gives up', () => {
    const r = giveUp(newRound('x', 'r1'))
    expect(r).toMatchObject({ status: 'lost', gaveUp: true })
    expect(giveUp(r)).toBe(r)
    expect(revealClue(r)).toBe(r)
  })

  it('validates restored rounds', () => {
    const known = (id: string) => id !== 'gone'
    expect(isValidRound(newRound('x', 'r'), known, 10)).toBe(true)
    expect(isValidRound(newRound('gone', 'r'), known, 10)).toBe(false)
    expect(isValidRound({ ...newRound('x', 'r'), cluesRevealed: 11 }, known, 10)).toBe(false)
    expect(isValidRound({ ...newRound('x', 'r'), guesses: ['gone'] }, known, 10)).toBe(false)
  })
})
