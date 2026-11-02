import { describe, expect, it } from 'vitest'
import { MIND_MAX_QUESTIONS, STORAGE_KEYS } from '../config'
import type { MindRound, MindTurn } from './mind'
import { averageQuestions, emptyMindStats, gameWinPercentage, recordMindRound } from './mindStats'
import { buildMindShareText } from './share'
import {
  loadMindStats,
  loadMode,
  saveMindRound,
  loadMindRound,
  saveMindStats,
  saveMode,
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

const q = (id: string): MindTurn => ({ kind: 'question', questionId: id, answer: 'yes' })
const g = (id: string, correct: boolean): MindTurn => ({ kind: 'guess', playerId: id, correct })

function round(
  roundId: string,
  status: MindRound['status'],
  questions: number,
  guesses: boolean[],
): MindRound {
  const turns = [
    ...Array.from({ length: questions }, (_, i) => q(`q${i}`)),
    ...guesses.map((c, i) => g(`p${i}`, c)),
  ]
  return { roundId, turns, status, revealedId: null }
}

describe('recordMindRound', () => {
  it('records a game win by questions asked', () => {
    const s = recordMindRound(emptyMindStats(), round('r1', 'won', 7, [false, true]))
    expect(s).toMatchObject({ played: 1, gameWins: 1, lastRoundId: 'r1' })
    expect(s.distribution[6]).toBe(1)
  })

  it('records a loss without touching the distribution', () => {
    const s = recordMindRound(emptyMindStats(), round('r1', 'lost', 10, [false, false, false]))
    expect(s).toMatchObject({ played: 1, gameWins: 0 })
    expect(s.distribution.every((n) => n === 0)).toBe(true)
  })

  it('counts a win with no questions in the first slot', () => {
    const s = recordMindRound(emptyMindStats(), round('r1', 'won', 0, [true]))
    expect(s.distribution[0]).toBe(1)
  })

  it('records each round once and ignores rounds in progress', () => {
    const playing = round('r1', 'playing', 3, [])
    const empty = emptyMindStats()
    expect(recordMindRound(empty, playing)).toBe(empty)
    const once = recordMindRound(empty, round('r1', 'lost', 3, []))
    expect(recordMindRound(once, { ...round('r1', 'lost', 3, []), revealedId: 'x' })).toBe(once)
  })

  it('computes win percentage and average questions', () => {
    let s = emptyMindStats()
    expect(gameWinPercentage(s)).toBe(0)
    expect(averageQuestions(s)).toBeNull()
    s = recordMindRound(s, round('a', 'won', 6, [true]))
    s = recordMindRound(s, round('b', 'won', 9, [true]))
    s = recordMindRound(s, round('c', 'lost', 10, [false, false, false]))
    expect(gameWinPercentage(s)).toBe(67)
    expect(averageQuestions(s)).toBe(7.5)
  })
})

describe('Mind Reader storage', () => {
  it('round-trips stats, round and mode', () => {
    const store = new MemoryStore()
    const stats = recordMindRound(emptyMindStats(), round('r1', 'won', 5, [true]))
    expect(saveMindStats(stats, store)).toBe(true)
    expect(loadMindStats(store)).toEqual(stats)
    const r = round('r2', 'playing', 2, [])
    saveMindRound(r, store)
    expect(loadMindRound(store)).toEqual(r)
    expect(loadMode(store)).toBe('clues')
    saveMode('mind', store)
    expect(loadMode(store)).toBe('mind')
  })

  it('falls back to empty stats for bad data and normalises the distribution', () => {
    const store = new MemoryStore()
    store.setItem(STORAGE_KEYS.mindStats, '{"played":"x"}')
    expect(loadMindStats(store)).toEqual(emptyMindStats())
    store.setItem(
      STORAGE_KEYS.mindStats,
      JSON.stringify({ played: 2, gameWins: 1, distribution: [1], lastRoundId: null }),
    )
    expect(loadMindStats(store).distribution).toHaveLength(MIND_MAX_QUESTIONS)
  })

  it('keeps working when storage throws', () => {
    expect(loadMindStats(brokenStore)).toEqual(emptyMindStats())
    expect(saveMindStats(emptyMindStats(), brokenStore)).toBe(false)
    expect(loadMindRound(brokenStore)).toBeNull()
    expect(saveMindRound(round('r', 'playing', 0, []), brokenStore)).toBe(false)
    expect(loadMode(brokenStore)).toBe('clues')
    expect(saveMode('mind', brokenStore)).toBe(false)
  })
})

describe('buildMindShareText', () => {
  it('shows questions used and the guesses on a game win', () => {
    const text = buildMindShareText({
      round: round('r', 'won', 7, [false, true]),
      siteUrl: 'https://example.com',
    })
    expect(text.split('\n')).toEqual([
      'Cricdle Mind Reader 🧠 read my mind in 7/10 questions',
      '🟨🟨🟨🟨🟨🟨🟨⬜⬜⬜ ❌✅',
      'https://example.com',
    ])
  })

  it('celebrates the user on a loss, without names', () => {
    const r = { ...round('r', 'lost', 10, [false, false, false]), revealedId: 'virat-kohli' }
    const text = buildMindShareText({ round: r, siteUrl: 'https://example.com' })
    expect(text.split('\n')).toEqual([
      'Cricdle Mind Reader 🧠 I beat it!',
      '🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨 ❌❌❌',
      'https://example.com',
    ])
    expect(text).not.toMatch(/kohli|p0/i)
  })
})
