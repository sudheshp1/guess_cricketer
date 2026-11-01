import { beforeEach, describe, expect, it } from 'vitest'
import { RECENT_ANSWER_MEMORY, STORAGE_KEYS } from '../config'
import { guess, newRound } from './round'
import { averageClues, emptyStats, recordRound, winPercentage } from './stats'
import {
  hasSeenHelp,
  loadPool,
  loadRecent,
  loadRound,
  loadStats,
  markHelpSeen,
  rememberAnswer,
  savePool,
  saveRound,
  saveStats,
  type KeyValueStore,
} from './storage'

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const brokenStore: KeyValueStore = {
  getItem() {
    throw new Error('SecurityError')
  },
  setItem() {
    throw new Error('QuotaExceededError')
  },
}

describe('round storage', () => {
  let store: MemoryStore
  beforeEach(() => {
    store = new MemoryStore()
  })

  it('round-trips the current round', () => {
    const round = guess(newRound('x', 'r1'), 'a')
    expect(saveRound(round, store)).toBe(true)
    expect(loadRound(store)).toEqual(round)
  })

  it('ignores corrupt or malformed data', () => {
    store.setItem(STORAGE_KEYS.round, '{not json')
    expect(loadRound(store)).toBeNull()
    store.setItem(STORAGE_KEYS.round, JSON.stringify({ answerId: 'x', guesses: 'nope' }))
    expect(loadRound(store)).toBeNull()
  })

  it('falls back safely when storage throws or is unavailable', () => {
    expect(loadRound(brokenStore)).toBeNull()
    expect(saveRound(newRound('x', 'r'), brokenStore)).toBe(false)
    expect(loadStats(brokenStore)).toEqual(emptyStats())
    expect(saveStats(emptyStats(), brokenStore)).toBe(false)
    expect(loadRecent(brokenStore)).toEqual([])
    expect(loadPool(brokenStore)).toBe('regular')
    expect(hasSeenHelp(brokenStore)).toBe(false)
    expect(markHelpSeen(brokenStore)).toBe(false)
    expect(loadRound(null)).toBeNull()
    expect(loadStats(null)).toEqual(emptyStats())
  })

  it('works with the real localStorage', () => {
    window.localStorage.clear()
    saveRound(newRound('x', 'r9'))
    expect(loadRound()?.roundId).toBe('r9')
    markHelpSeen()
    expect(hasSeenHelp()).toBe(true)
  })
})

describe('recent answers and pool', () => {
  it('keeps the most recent answers, without duplicates', () => {
    const store = new MemoryStore()
    let recent: string[] = []
    for (let i = 0; i < RECENT_ANSWER_MEMORY + 5; i++)
      recent = rememberAnswer(recent, `p${i}`, store)
    expect(recent).toHaveLength(RECENT_ANSWER_MEMORY)
    expect(recent.at(-1)).toBe(`p${RECENT_ANSWER_MEMORY + 4}`)
    recent = rememberAnswer(recent, recent[0]!, store)
    expect(new Set(recent).size).toBe(recent.length)
    expect(loadRecent(store)).toEqual(recent)
  })

  it('remembers the chosen pool and defaults to regular', () => {
    const store = new MemoryStore()
    expect(loadPool(store)).toBe('regular')
    savePool('all', store)
    expect(loadPool(store)).toBe('all')
    store.setItem(STORAGE_KEYS.pool, '"bogus"')
    expect(loadPool(store)).toBe('regular')
  })
})

describe('stats', () => {
  const won = (id: string, clues: number) => ({
    ...newRound('x', id),
    status: 'won' as const,
    cluesRevealed: clues,
  })
  const lost = (id: string) => ({
    ...newRound('x', id),
    status: 'lost' as const,
    cluesRevealed: 10,
  })

  it('records a win by the clue it was solved on', () => {
    const s = recordRound(emptyStats(), won('a', 3))
    expect(s).toMatchObject({
      played: 1,
      wins: 1,
      currentStreak: 1,
      maxStreak: 1,
      lastRoundId: 'a',
    })
    expect(s.distribution[2]).toBe(1)
  })

  it('builds and resets streaks', () => {
    let s = recordRound(emptyStats(), won('a', 1))
    s = recordRound(s, won('b', 2))
    expect(s.currentStreak).toBe(2)
    s = recordRound(s, lost('c'))
    expect(s).toMatchObject({ played: 3, wins: 2, currentStreak: 0, maxStreak: 2 })
  })

  it('ignores rounds in progress and rounds already recorded', () => {
    const playing = newRound('x', 'p')
    expect(recordRound(emptyStats(), playing)).toEqual(emptyStats())
    const once = recordRound(emptyStats(), won('a', 1))
    expect(recordRound(once, won('a', 1))).toBe(once)
  })

  it('computes win % and average clues', () => {
    let s = recordRound(emptyStats(), won('a', 2))
    s = recordRound(s, won('b', 5))
    s = recordRound(s, lost('c'))
    expect(winPercentage(s)).toBe(67)
    expect(averageClues(s)).toBe(3.5)
    expect(averageClues(emptyStats())).toBeNull()
    expect(winPercentage(emptyStats())).toBe(0)
  })

  it('round-trips stats and pads the distribution to MAX_CLUES', () => {
    const store = new MemoryStore()
    saveStats({ ...emptyStats(), played: 3, distribution: [1, 2] }, store)
    const loaded = loadStats(store)
    expect(loaded.played).toBe(3)
    expect(loaded.distribution).toEqual([1, 2, 0, 0, 0, 0, 0, 0, 0, 0])
  })
})
