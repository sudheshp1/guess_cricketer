import { describe, expect, it } from 'vitest'
import { MIND_MAX_GUESSES, MIND_MAX_QUESTIONS } from '../config'
import { makePlayer } from '../test/fixtures'
import type { MindAnswer, Player, Question } from '../types'
import {
  answerGuess,
  answerQuestion,
  bestQuestion,
  concede,
  createEngine,
  guessesMade,
  isValidMindRound,
  mismatches,
  newMindRound,
  nextMove,
  questionsAsked,
  ranking,
  reveal,
  type MindEngine,
  type MindRound,
} from './mind'
import { PLAYERS } from './players'
import { QUESTIONS } from './questions'

// A tiny world: four players, questions that split them.
const players = [
  makePlayer({ id: 'a', difficulty: 1, role: 'Batter', country: 'India' }),
  makePlayer({ id: 'b', difficulty: 1, role: 'Bowler', country: 'India' }),
  makePlayer({ id: 'c', difficulty: 2, role: 'Batter', country: 'England' }),
  makePlayer({ id: 'd', difficulty: 3, role: 'Bowler', country: 'England' }),
]
const batter: Question = {
  id: 'batter',
  text: 'Is your player a batter?',
  difficulty: 'easy',
  test: (p) => p.role === 'Batter',
}
const questions: Question[] = [
  batter,
  {
    id: 'india',
    text: 'Is your player Indian?',
    difficulty: 'easy',
    test: (p) => p.country === 'India',
  },
  { id: 'unknown', text: 'Is your player unknown?', difficulty: 'easy', test: () => null },
]
const engine = createEngine(players, questions)

const share = (e: MindEngine, r: MindRound, id: string) =>
  ranking(e, r).find((x) => x.player.id === id)?.share ?? 0

describe('scoring', () => {
  it('starts from a prior that favours famous players', () => {
    const r = ranking(engine, newMindRound('r'))
    expect(r.map((x) => x.player.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(share(engine, newMindRound('r'), 'a')).toBeCloseTo(4 / 11)
  })

  it('moves weight towards players matching the answers', () => {
    const r = answerQuestion(engine, newMindRound('r'), 'batter', 'yes')
    expect(share(engine, r, 'a') + share(engine, r, 'c')).toBeGreaterThan(0.85)
  })

  it('keeps contradicted players alive with a small score', () => {
    const r = answerQuestion(engine, newMindRound('r'), 'batter', 'yes')
    expect(share(engine, r, 'b')).toBeGreaterThan(0)
    expect(share(engine, r, 'b')).toBeLessThan(0.15)
  })

  it('ignores "not sure" and unknown data', () => {
    const start = newMindRound('r')
    const unsure = answerQuestion(engine, start, 'batter', 'unsure')
    const unknown = answerQuestion(engine, start, 'unknown', 'yes')
    for (const p of players) {
      expect(share(engine, unsure, p.id)).toBeCloseTo(share(engine, start, p.id))
      expect(share(engine, unknown, p.id)).toBeCloseTo(share(engine, start, p.id))
    }
  })

  it('rules out wrong guesses entirely', () => {
    const r = answerGuess(engine, newMindRound('r'), 'a', false)
    expect(share(engine, r, 'a')).toBe(0)
  })
})

describe('choosing the next move', () => {
  it('never picks a question that teaches nothing', () => {
    expect(bestQuestion(engine, newMindRound('r'))?.id).not.toBe('unknown')
  })

  it('does not ask the same question twice', () => {
    const first = bestQuestion(engine, newMindRound('r'))!
    const r = answerQuestion(engine, newMindRound('r'), first.id, 'yes')
    expect(bestQuestion(engine, r)?.id).not.toBe(first.id)
  })

  it('prefers easy questions when information is equal', () => {
    const hard: Question = { ...batter, id: 'batter-hard', difficulty: 'hard' }
    const e = createEngine(players, [hard, batter])
    expect(bestQuestion(e, newMindRound('r'))?.id).toBe('batter')
  })

  it('guesses once the leader is clear', () => {
    let r = answerQuestion(engine, newMindRound('r'), 'batter', 'yes')
    r = answerQuestion(engine, r, 'india', 'yes')
    expect(nextMove(engine, r)).toEqual({ kind: 'guess', player: players[0] })
  })

  it('guesses when the questions run out', () => {
    const many: Question[] = Array.from({ length: MIND_MAX_QUESTIONS + 2 }, (_, i) => ({
      ...batter,
      id: `q${i}`,
      test: (p: Player) => p.id === players[i % players.length]!.id,
    }))
    const e = createEngine(players, many, { guessThreshold: 1.01 })
    let r = newMindRound('r')
    for (let i = 0; i < MIND_MAX_QUESTIONS; i++) r = answerQuestion(e, r, `q${i}`, 'unsure')
    expect(questionsAsked(r)).toBe(MIND_MAX_QUESTIONS)
    expect(nextMove(e, r)?.kind).toBe('guess')
    expect(answerQuestion(e, r, `q${MIND_MAX_QUESTIONS}`, 'yes')).toBe(r)
  })
})

describe('round rules', () => {
  it('wins on a correct guess', () => {
    const r = answerGuess(engine, newMindRound('r'), 'c', true)
    expect(r.status).toBe('won')
    expect(guessesMade(r)).toBe(1)
  })

  it('loses after the last wrong guess', () => {
    let r = newMindRound('r')
    for (const id of ['a', 'b', 'c'].slice(0, MIND_MAX_GUESSES)) {
      r = answerGuess(engine, r, id, false)
    }
    expect(r.status).toBe('lost')
  })

  it('loses when every player has been ruled out', () => {
    const e = createEngine(players.slice(0, 1), questions)
    expect(answerGuess(e, newMindRound('r'), 'a', false).status).toBe('lost')
  })

  it('ignores repeats, unknown ids and moves after the round ends', () => {
    const r = answerQuestion(engine, newMindRound('r'), 'batter', 'yes')
    expect(answerQuestion(engine, r, 'batter', 'no')).toBe(r)
    expect(answerQuestion(engine, r, 'nope', 'no')).toBe(r)
    expect(answerGuess(engine, r, 'nope', true)).toBe(r)
    const wrong = answerGuess(engine, r, 'a', false)
    expect(answerGuess(engine, wrong, 'a', true)).toBe(wrong)
    const won = answerGuess(engine, r, 'c', true)
    expect(answerQuestion(engine, won, 'india', 'yes')).toBe(won)
    expect(answerGuess(engine, won, 'a', true)).toBe(won)
    expect(nextMove(engine, won)).toBeNull()
    expect(concede(won)).toBe(won)
  })

  it('lets the user concede and reveal their player', () => {
    const lost = concede(newMindRound('r'))
    expect(lost.status).toBe('lost')
    expect(reveal(engine, newMindRound('r'), 'a').revealedId).toBeNull() // not over yet
    expect(reveal(engine, lost, 'nope')).toBe(lost)
    expect(reveal(engine, lost, 'd').revealedId).toBe('d')
  })

  it('explains which answers disagreed with the data', () => {
    let r = answerQuestion(engine, newMindRound('r'), 'batter', 'yes')
    r = answerQuestion(engine, r, 'india', 'unsure')
    r = answerQuestion(engine, r, 'unknown', 'no')
    expect(mismatches(engine, r, 'b').map((m) => [m.question.id, m.said])).toEqual([
      ['batter', 'yes'],
    ])
    expect(mismatches(engine, r, 'a')).toEqual([])
  })

  it('validates saved rounds', () => {
    let r = answerQuestion(engine, newMindRound('r'), 'batter', 'yes')
    r = answerGuess(engine, r, 'a', false)
    expect(isValidMindRound(JSON.parse(JSON.stringify(r)), engine)).toBe(true)
    expect(isValidMindRound(null, engine)).toBe(false)
    expect(isValidMindRound({ ...r, status: 'odd' }, engine)).toBe(false)
    expect(isValidMindRound({ ...r, revealedId: 'zz' }, engine)).toBe(false)
    const badQuestion = [{ kind: 'question', questionId: 'gone', answer: 'yes' }]
    expect(isValidMindRound({ ...r, turns: badQuestion }, engine)).toBe(false)
    const badGuess = [{ kind: 'guess', playerId: 'a', correct: 'yes' }]
    expect(isValidMindRound({ ...r, turns: badGuess }, engine)).toBe(false)
  })
})

/** Play a full round against the real data, answering truthfully except at `flipAt` (0-based). */
function play(e: MindEngine, target: Player, flipAt = -1): MindRound {
  let r = newMindRound('sim')
  let asked = 0
  for (let step = 0; step < 50 && r.status === 'playing'; step++) {
    const move = nextMove(e, r)
    if (!move) break
    if (move.kind === 'guess') {
      r = answerGuess(e, r, move.player.id, move.player.id === target.id)
      continue
    }
    const truth = move.question.test(target)
    let answer: MindAnswer = truth === null ? 'unsure' : truth ? 'yes' : 'no'
    if (asked++ === flipAt && answer !== 'unsure') answer = answer === 'yes' ? 'no' : 'yes'
    r = answerQuestion(e, r, move.question.id, answer)
  }
  return r
}

describe('simulation against the real player data', () => {
  const real = createEngine(PLAYERS, QUESTIONS)
  const regular = PLAYERS.filter((p) => p.difficulty <= 2)
  const pct = (rounds: MindRound[]) =>
    (100 * rounds.filter((r) => r.status === 'won').length) / rounds.length

  it('guesses at least 95% of the regular pool with truthful answers', () => {
    const rounds = regular.map((p) => play(real, p))
    const rate = pct(rounds)
    const won = rounds.filter((r) => r.status === 'won')
    const avg = won.reduce((sum, r) => sum + questionsAsked(r), 0) / won.length
    console.info(
      `Mind Reader, truthful answers: ${rate.toFixed(1)}% won, ${avg.toFixed(2)} questions on average`,
    )
    expect(rate).toBeGreaterThanOrEqual(95)
    for (const r of rounds) {
      expect(questionsAsked(r)).toBeLessThanOrEqual(MIND_MAX_QUESTIONS)
      expect(guessesMade(r)).toBeLessThanOrEqual(MIND_MAX_GUESSES)
    }
  }, 60_000)

  it('still often recovers from one wrong answer', () => {
    // Every other regular player, with one of the first 8 answers flipped (deterministic).
    const sample = regular.filter((_, i) => i % 2 === 0)
    const rate = pct(sample.map((p, i) => play(real, p, (i * 5) % 8)))
    console.info(`Mind Reader, one wrong answer: ${rate.toFixed(1)}% won`)
    expect(rate).toBeGreaterThanOrEqual(45)
  }, 60_000)
})
