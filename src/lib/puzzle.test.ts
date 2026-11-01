import { describe, expect, it } from 'vitest'
import { makePlayer } from '../test/fixtures'
import { getAnswer, getTodaysPuzzle } from './puzzle'
import { PLAYERS, PLAYERS_BY_ID, SCHEDULE } from './players'

describe('getAnswer', () => {
  const players = new Map(['a', 'b', 'c'].map((id) => [id, makePlayer({ id })]))
  const schedule = ['b', 'c', 'a']

  it('maps puzzle 1 to the first schedule entry and cycles', () => {
    expect(getAnswer(1, schedule, players).id).toBe('b')
    expect(getAnswer(2, schedule, players).id).toBe('c')
    expect(getAnswer(3, schedule, players).id).toBe('a')
    expect(getAnswer(4, schedule, players).id).toBe('b')
  })

  it('throws on an unknown id or empty schedule', () => {
    expect(() => getAnswer(1, ['zzz'], players)).toThrow(/unknown/)
    expect(() => getAnswer(1, [], players)).toThrow(/empty/)
  })
})

describe('bundled data', () => {
  it('has a schedule that only points at known, answer-eligible players', () => {
    expect(SCHEDULE.length).toBeGreaterThan(0)
    for (const id of SCHEDULE) {
      const p = PLAYERS_BY_ID.get(id)
      expect(p, id).toBeDefined()
      expect(p!.difficulty).toBeLessThanOrEqual(2)
    }
  })

  it('has unique player ids', () => {
    expect(new Set(PLAYERS.map((p) => p.id)).size).toBe(PLAYERS.length)
  })

  it('gives everyone the same answer at the same instant', () => {
    const now = new Date('2026-11-05T10:00:00Z')
    expect(getTodaysPuzzle(now)).toEqual(getTodaysPuzzle(new Date(now)))
  })
})
