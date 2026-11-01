import { describe, expect, it } from 'vitest'
import { MAX_CLUES } from '../config'
import { makePlayer } from '../test/fixtures'
import { buildClues, nameShape } from './clues'

const text = (player = makePlayer()) =>
  Object.fromEntries(buildClues(player).map((c) => [c.key, c.text]))

describe('buildClues', () => {
  it(`returns ${MAX_CLUES} clues from vague to specific`, () => {
    expect(buildClues(makePlayer()).map((c) => c.key)).toEqual([
      'role',
      'country',
      'style',
      'debut',
      'status',
      'matches',
      'batting',
      'bowling',
      'milestones',
      'initials',
    ])
  })

  it('describes role, country, style, debut and status', () => {
    const t = text()
    expect(t.role).toBe('Batter')
    expect(t.country).toBe('India')
    expect(t.style).toBe('Right-handed batter, bowls right-arm off-spin')
    expect(t.debut).toBe('International debut in 2010')
    expect(t.status).toBe('Still playing international cricket')
  })

  it('handles retired players and non-bowlers', () => {
    const t = text(
      makePlayer({ active: false, lastYear: 2013, bowlingType: 'None', battingHand: 'Left' }),
    )
    expect(t.country).toBe('India')
    expect(t.status).toBe('Retired · last international match in 2013')
    expect(t.style).toBe("Left-handed batter, doesn't bowl")
    expect(text(makePlayer({ active: false, lastYear: null })).status).toBe(
      'Retired from international cricket',
    )
  })

  it('splits international matches by format', () => {
    expect(text().matches).toBe('300 international matches (100 Tests, 200 ODIs)')
    const one = makePlayer({
      intlMatches: 1,
      stats: {
        t20i: {
          matches: 1,
          runs: null,
          highScore: null,
          hundreds: null,
          fifties: null,
          wickets: null,
          bestBowling: null,
        },
      },
    })
    expect(text(one).matches).toBe('1 international matches (1 T20I)')
  })

  it('reports runs with the best highest score across formats', () => {
    expect(text().batting).toBe('Runs: 7,000 in Tests, 8,000 in ODIs · Highest score 254* (Test)')
  })

  it('treats a not-out score as higher than the same score out', () => {
    const p = makePlayer()
    p.stats.odi!.highScore = '254'
    expect(text(p).batting).toContain('254* (Test)')
    p.stats.odi!.highScore = '255'
    expect(text(p).batting).toContain('255 (ODI)')
  })

  it('reports wickets with the best figures (more wickets, then fewer runs)', () => {
    expect(text().bowling).toBe('Wickets: 5 in Tests, 10 in ODIs · Best 3/20 (ODI)')
    const p = makePlayer()
    p.stats.test!.bestBowling = '3/15'
    expect(text(p).bowling).toContain('Best 3/15 (Test)')
  })

  it('handles players with no wickets or who never bowled', () => {
    const p = makePlayer()
    p.stats.test!.wickets = 0
    p.stats.odi!.wickets = 0
    expect(text(p).bowling).toBe('No international wickets.')
    p.stats.test!.wickets = null
    p.stats.odi!.wickets = null
    expect(text(p).bowling).toBe('Never bowled in international cricket.')
  })

  it('totals hundreds and fifties', () => {
    expect(text().milestones).toBe('45 international hundreds (20 Test, 25 ODI) · 70 fifties')
    const p = makePlayer()
    p.stats.test!.hundreds = 0
    p.stats.odi!.hundreds = 0
    p.stats.test!.fifties = 1
    p.stats.odi!.fifties = 0
    expect(text(p).milestones).toBe('No international hundreds · 1 fifty')
  })

  it('cites the source date on stat clues', () => {
    const clues = buildClues(makePlayer())
    expect(clues.find((c) => c.key === 'batting')!.note).toBe(
      'Career figures from Wikipedia, as of 1 October 2026.',
    )
    expect(clues.find((c) => c.key === 'role')!.note).toBeUndefined()
  })

  it('never reveals the name before the last clue', () => {
    const p = makePlayer({ name: 'Zebedee Quux' })
    const early = buildClues(p).slice(0, -1)
    for (const c of early) expect(`${c.text} ${c.note ?? ''}`).not.toMatch(/Zebedee|Quux/)
  })
})

describe('nameShape', () => {
  it('shows first letters and word lengths', () => {
    expect(nameShape('Virat Kohli')).toBe('V____  K____')
    expect(nameShape('AB de Villiers')).toBe('A_  d_  V_______')
  })

  it('keeps punctuation so hyphenated names keep their shape', () => {
    expect(nameShape('Inzamam-ul-Haq')).toBe('I______-__-___')
    expect(nameShape("Kevin O'Brien")).toBe("K____  O'_____")
  })
})
