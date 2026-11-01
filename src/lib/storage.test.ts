import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../config'
import { applyGameResult, displayedStreak, emptyStats, winPercentage } from './stats'
import {
  hasSeenHelp,
  loadGame,
  loadStats,
  markHelpSeen,
  saveGame,
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

describe('game storage', () => {
  let store: MemoryStore
  beforeEach(() => {
    store = new MemoryStore()
  })

  it("round-trips today's game", () => {
    const game = { puzzleNumber: 5, guesses: ['a', 'b'], status: 'playing' as const }
    expect(saveGame(game, store)).toBe(true)
    expect(loadGame(5, store)).toEqual(game)
  })

  it('ignores a saved game from a different day', () => {
    saveGame({ puzzleNumber: 4, guesses: ['a'], status: 'won' }, store)
    expect(loadGame(5, store)).toBeNull()
  })

  it('ignores corrupt or malformed data', () => {
    store.setItem(STORAGE_KEYS.game, '{not json')
    expect(loadGame(1, store)).toBeNull()
    store.setItem(STORAGE_KEYS.game, JSON.stringify({ puzzleNumber: 1, guesses: 'x' }))
    expect(loadGame(1, store)).toBeNull()
  })

  it('falls back safely when storage throws', () => {
    expect(loadGame(1, brokenStore)).toBeNull()
    expect(saveGame({ puzzleNumber: 1, guesses: [], status: 'playing' }, brokenStore)).toBe(false)
    expect(loadStats(brokenStore)).toEqual(emptyStats())
    expect(saveStats(emptyStats(), brokenStore)).toBe(false)
    expect(hasSeenHelp(brokenStore)).toBe(false)
    expect(markHelpSeen(brokenStore)).toBe(false)
  })

  it('falls back safely when storage is unavailable', () => {
    expect(loadGame(1, null)).toBeNull()
    expect(loadStats(null)).toEqual(emptyStats())
    expect(saveStats(emptyStats(), null)).toBe(false)
  })

  it('works with the real localStorage', () => {
    window.localStorage.clear()
    saveGame({ puzzleNumber: 9, guesses: ['x'], status: 'lost' })
    expect(loadGame(9)?.status).toBe('lost')
    markHelpSeen()
    expect(hasSeenHelp()).toBe(true)
  })
})

describe('stats storage', () => {
  it('returns empty stats when nothing is saved', () => {
    expect(loadStats(new MemoryStore())).toEqual(emptyStats())
  })

  it('round-trips stats and pads the distribution to MAX_GUESSES', () => {
    const store = new MemoryStore()
    const stats = { ...emptyStats(), played: 3, distribution: [1, 2] }
    saveStats(stats, store)
    const loaded = loadStats(store)
    expect(loaded.played).toBe(3)
    expect(loaded.distribution).toEqual([1, 2, 0, 0, 0, 0, 0, 0])
  })
})

describe('applyGameResult (streak rules)', () => {
  it('starts a streak at 1 on a first win and records the guess count', () => {
    const s = applyGameResult(emptyStats(), 10, true, 3)
    expect(s).toMatchObject({ played: 1, wins: 1, currentStreak: 1, maxStreak: 1 })
    expect(s.distribution[2]).toBe(1)
    expect(s.lastCompletedPuzzle).toBe(10)
  })

  it('continues the streak when the previous puzzle was completed', () => {
    let s = applyGameResult(emptyStats(), 10, true, 3)
    s = applyGameResult(s, 11, true, 5)
    expect(s.currentStreak).toBe(2)
    expect(s.maxStreak).toBe(2)
  })

  it('restarts the streak at 1 after a missed day', () => {
    let s = applyGameResult(emptyStats(), 10, true, 3)
    s = applyGameResult(s, 11, true, 3)
    s = applyGameResult(s, 13, true, 3)
    expect(s.currentStreak).toBe(1)
    expect(s.maxStreak).toBe(2)
  })

  it('resets the streak to 0 on a loss but keeps maxStreak', () => {
    let s = applyGameResult(emptyStats(), 10, true, 3)
    s = applyGameResult(s, 11, false, 8)
    expect(s).toMatchObject({ played: 2, wins: 1, currentStreak: 0, maxStreak: 1 })
    expect(s.distribution.reduce((a, b) => a + b, 0)).toBe(1)
  })

  it('counts a puzzle only once (reload guard)', () => {
    const once = applyGameResult(emptyStats(), 10, true, 3)
    const twice = applyGameResult(once, 10, true, 3)
    expect(twice).toBe(once)
  })

  it('computes win percentage', () => {
    expect(winPercentage(emptyStats())).toBe(0)
    let s = applyGameResult(emptyStats(), 1, true, 1)
    s = applyGameResult(s, 2, false, 8)
    s = applyGameResult(s, 3, true, 2)
    expect(winPercentage(s)).toBe(67)
  })

  it('hides a stale streak in the display without rewriting stats', () => {
    const s = applyGameResult(emptyStats(), 10, true, 3)
    expect(displayedStreak(s, 10)).toBe(1)
    expect(displayedStreak(s, 11)).toBe(1)
    expect(displayedStreak(s, 12)).toBe(0)
    expect(displayedStreak(emptyStats(), 1)).toBe(0)
  })
})
