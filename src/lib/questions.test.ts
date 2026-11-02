import { describe, expect, it } from 'vitest'
import { makePlayer } from '../test/fixtures'
import { PLAYERS } from './players'
import { QUESTIONS, QUESTIONS_BY_ID } from './questions'

const ask = (id: string, overrides: Parameters<typeof makePlayer>[0] = {}) => {
  const question = QUESTIONS_BY_ID.get(id)
  if (!question) throw new Error(`no question ${id}`)
  return question.test(makePlayer(overrides))
}

describe('question bank', () => {
  it('has unique kebab-case ids', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('asks every question about "your player" as a question', () => {
    for (const q of QUESTIONS) {
      expect(q.text).toMatch(/your player/)
      expect(q.text.endsWith('?')).toBe(true)
    }
  })

  it('never names a player in question text', () => {
    const names = PLAYERS.flatMap((p) => [p.name, ...p.aliases]).filter((s) => s.length > 3)
    for (const q of QUESTIONS) {
      for (const name of names) expect(q.text).not.toContain(name)
    }
  })

  it('gives a boolean or null for every player', () => {
    for (const q of QUESTIONS) {
      for (const p of PLAYERS) expect([true, false, null]).toContain(q.test(p))
    }
  })

  it('can tell every pair of players apart', () => {
    const answers = PLAYERS.map((p) => QUESTIONS.map((q) => q.test(p)))
    const clashes: string[] = []
    for (let i = 0; i < PLAYERS.length; i++) {
      for (let j = i + 1; j < PLAYERS.length; j++) {
        const a = answers[i] ?? []
        const b = answers[j] ?? []
        const differ = a.some(
          (v, k) => v !== null && b[k] !== null && b[k] !== undefined && v !== b[k],
        )
        if (!differ) clashes.push(`${PLAYERS[i]?.id} / ${PLAYERS[j]?.id}`)
      }
    }
    expect(clashes).toEqual([])
  })

  it('splits the player list usefully: every question has yes and no answers', () => {
    for (const q of QUESTIONS) {
      const results = PLAYERS.map((p) => q.test(p))
      expect(results, q.id).toContain(true)
      expect(results, q.id).toContain(false)
    }
  })
})

describe('individual questions', () => {
  it('answers role and country', () => {
    expect(ask('role-batter')).toBe(true)
    expect(ask('role-keeper', { role: 'Wicketkeeper-Batter' })).toBe(true)
    expect(ask('role-bats-first', { role: 'Wicketkeeper-Batter' })).toBe(true)
    expect(ask('role-bats-first', { role: 'Bowler' })).toBe(false)
    expect(ask('country-india')).toBe(true)
    expect(ask('country-new-zealand', { country: 'New Zealand' })).toBe(true)
    expect(ask('region-asia', { country: 'Afghanistan' })).toBe(true)
    expect(ask('region-big-four', { country: 'West Indies' })).toBe(false)
  })

  it('answers bowling style', () => {
    expect(ask('bowls-spin', { bowlingType: 'Left-arm orthodox' })).toBe(true)
    expect(ask('bowls-pace', { bowlingType: 'Left-arm orthodox' })).toBe(false)
    expect(ask('bowls-fast', { bowlingType: 'Right-arm medium' })).toBe(false)
    expect(ask('bowls-left-arm', { bowlingType: 'Left-arm fast' })).toBe(true)
    expect(ask('bowls-leg-spin', { bowlingType: 'Left-arm wrist-spin' })).toBe(true)
    expect(ask('bowls-none', { bowlingType: 'None' })).toBe(true)
  })

  it('answers career span, with null when the last year is unknown', () => {
    expect(ask('debut-before-2010', { debutYear: 2009 })).toBe(true)
    expect(ask('debut-before-2010', { debutYear: 2010 })).toBe(false)
    expect(ask('retired-before-2015', { active: true })).toBe(false)
    expect(ask('retired-before-2015', { active: false, lastYear: 2014 })).toBe(true)
    expect(ask('retired-before-2015', { active: false, lastYear: null })).toBeNull()
    expect(ask('decade-1990s', { debutYear: 1985, active: false, lastYear: 1995 })).toBe(true)
    expect(ask('decade-1990s', { debutYear: 2001 })).toBe(false)
    expect(ask('decade-1990s', { debutYear: 1985, active: false, lastYear: null })).toBeNull()
  })

  it('sums career figures across formats', () => {
    // Fixture: 7,000 Test + 8,000 ODI runs; 20 + 25 hundreds; 5 + 10 wickets.
    expect(ask('runs-15000')).toBe(true)
    expect(ask('runs-test-10000')).toBe(false)
    expect(ask('hundreds-40')).toBe(true)
    expect(ask('wickets-50')).toBe(false)
    expect(ask('tests-100')).toBe(true)
    expect(ask('played-t20i')).toBe(false)
  })

  it('treats unknown runs as unknown, but missing wickets as none', () => {
    const stats = {
      test: {
        matches: 10,
        runs: null,
        highScore: null,
        hundreds: null,
        fifties: null,
        wickets: null,
        bestBowling: null,
      },
    }
    expect(ask('runs-1000', { stats })).toBeNull()
    expect(ask('wickets-50', { stats })).toBe(false)
    expect(ask('test-double', { stats })).toBeNull()
    expect(ask('five-for', { stats })).toBe(false)
  })

  it('reads high scores and best bowling', () => {
    expect(ask('test-double')).toBe(true) // 254*
    expect(ask('test-double', { stats: {} })).toBe(false) // no Tests
    expect(ask('five-for')).toBe(false) // best 3/20
  })
})
