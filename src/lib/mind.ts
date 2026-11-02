import {
  MIND_ERROR_RATE,
  MIND_GUESS_THRESHOLD,
  MIND_MAX_GUESSES,
  MIND_MAX_QUESTIONS,
  MIND_PRIOR_WEIGHTS,
} from '../config'
import type { MindAnswer, Player, Question, QuestionDifficulty } from '../types'

/**
 * Mind Reader engine: the user thinks of a player and the game asks yes/no questions.
 *
 * Every player has a score: a prior (famous players first) times the likelihood of the answers so
 * far. An answer that matches the data keeps the score, a contradicting one multiplies it by
 * MIND_ERROR_RATE (so one mistake doesn't end the round), and "not sure" or unknown data leave it
 * mostly alone. The next question is the one with the highest expected information gain.
 *
 * All functions are pure. Rounds only store what the user said, so the next move can always be
 * recomputed (e.g. after a reload).
 */

export type MindTurn =
  | { kind: 'question'; questionId: string; answer: MindAnswer }
  | { kind: 'guess'; playerId: string; correct: boolean }

export type MindStatus = 'playing' | 'won' | 'lost'

export interface MindRound {
  roundId: string
  turns: MindTurn[]
  status: MindStatus
  /** The player the user says they were thinking of, after a loss. */
  revealedId: string | null
}

export type MindMove =
  { kind: 'question'; question: Question } | { kind: 'guess'; player: Player } | null

/** Players, questions and the precomputed answer matrix. Build once with `createEngine`. */
export interface MindEngine {
  players: readonly Player[]
  questions: readonly Question[]
  questionIndex: ReadonlyMap<string, number>
  playerIndex: ReadonlyMap<string, number>
  /** answers[q * players.length + p]: 1 yes, 0 no, -1 unknown. */
  answers: Int8Array
  prior: Float64Array
  /** Chance that an answer disagrees with the data. */
  errorRate: number
  /** Guess once the leader holds this share of the total score. */
  guessThreshold: number
}

export interface EngineOptions {
  errorRate?: number
  guessThreshold?: number
}

/** Small preference for questions people can answer confidently. */
const DIFFICULTY_PENALTY: Record<QuestionDifficulty, number> = { easy: 0, medium: 0.02, hard: 0.05 }

/** Questions expected to teach less than this (in bits) aren't worth a turn. */
const MIN_INFORMATION = 0.02

export function createEngine(
  players: readonly Player[],
  questions: readonly Question[],
  { errorRate = MIND_ERROR_RATE, guessThreshold = MIND_GUESS_THRESHOLD }: EngineOptions = {},
): MindEngine {
  const answers = new Int8Array(questions.length * players.length)
  questions.forEach((question, qi) => {
    players.forEach((player, pi) => {
      const a = question.test(player)
      answers[qi * players.length + pi] = a === null ? -1 : a ? 1 : 0
    })
  })
  return {
    players,
    questions,
    questionIndex: new Map(questions.map((x, i) => [x.id, i])),
    playerIndex: new Map(players.map((x, i) => [x.id, i])),
    answers,
    prior: Float64Array.from(players, (p) => MIND_PRIOR_WEIGHTS[p.difficulty]),
    errorRate,
    guessThreshold,
  }
}

export function newMindRound(roundId: string): MindRound {
  return { roundId, turns: [], status: 'playing', revealedId: null }
}

export const questionsAsked = (round: MindRound) =>
  round.turns.filter((t) => t.kind === 'question').length
export const guessesMade = (round: MindRound) =>
  round.turns.filter((t) => t.kind === 'guess').length

/** Chance a user says yes, given the data's answer (1 yes, 0 no, -1 unknown). */
function yesChance(data: number, errorRate: number): number {
  if (data === -1) return 0.5
  return data === 1 ? 1 - errorRate : errorRate
}

/** Current (unnormalised) score of every player, in engine order. Wrong guesses score 0. */
export function scores(engine: MindEngine, round: MindRound): Float64Array {
  const n = engine.players.length
  const w = Float64Array.from(engine.prior)
  for (const turn of round.turns) {
    if (turn.kind === 'guess') {
      const pi = engine.playerIndex.get(turn.playerId)
      if (pi !== undefined && !turn.correct) w[pi] = 0
      continue
    }
    const qi = engine.questionIndex.get(turn.questionId)
    if (qi === undefined || turn.answer === 'unsure') continue
    const yes = turn.answer === 'yes'
    for (let p = 0; p < n; p++) {
      const chance = yesChance(engine.answers[qi * n + p] ?? -1, engine.errorRate)
      w[p] = (w[p] ?? 0) * (yes ? chance : 1 - chance)
    }
  }
  return w
}

const entropy = (x: number) =>
  x <= 0 || x >= 1 ? 0 : -x * Math.log2(x) - (1 - x) * Math.log2(1 - x)

/** Expected information (bits) from asking question `qi`, given the current weights. */
function information(engine: MindEngine, qi: number, w: Float64Array, total: number): number {
  const n = engine.players.length
  const base = qi * n
  // Sum the weights of players whose data says yes / unknown; the rest say no.
  let yesWeight = 0
  let unknownWeight = 0
  for (let p = 0; p < n; p++) {
    const data = engine.answers[base + p]
    if (data === 1) yesWeight += w[p] ?? 0
    else if (data === -1) unknownWeight += w[p] ?? 0
  }
  const noWeight = total - yesWeight - unknownWeight
  const e = engine.errorRate
  const yes = yesWeight * (1 - e) + noWeight * e + unknownWeight / 2
  const noise = (yesWeight + noWeight) * entropy(e) + unknownWeight
  return entropy(yes / total) - noise / total
}

/** Players ranked by score, highest first, with their share of the total. Excludes zero scores. */
export function ranking(engine: MindEngine, round: MindRound): { player: Player; share: number }[] {
  const w = scores(engine, round)
  const total = w.reduce((a, b) => a + b, 0)
  if (total === 0) return []
  return engine.players
    .map((player, i) => ({ player, share: (w[i] ?? 0) / total }))
    .filter((r) => r.share > 0)
    .sort((a, b) => b.share - a.share)
}

/** The best question to ask next, or null if no unasked question is worth a turn. */
export function bestQuestion(engine: MindEngine, round: MindRound): Question | null {
  const w = scores(engine, round)
  const total = w.reduce((a, b) => a + b, 0)
  if (total === 0) return null
  const asked = new Set(round.turns.flatMap((t) => (t.kind === 'question' ? [t.questionId] : [])))
  let best: Question | null = null
  let bestScore = -Infinity
  engine.questions.forEach((question, qi) => {
    if (asked.has(question.id)) return
    const info = information(engine, qi, w, total)
    if (info < MIN_INFORMATION) return
    const score = info - DIFFICULTY_PENALTY[question.difficulty]
    if (score > bestScore) {
      bestScore = score
      best = question
    }
  })
  return best
}

/**
 * What the game does next: ask a question, make a guess, or nothing (round over, or out of
 * guesses / candidates). Guesses once the leader is clear enough, or when questions run out.
 */
export function nextMove(engine: MindEngine, round: MindRound): MindMove {
  if (round.status !== 'playing' || guessesMade(round) >= MIND_MAX_GUESSES) return null
  const ranked = ranking(engine, round)
  const top = ranked[0]
  if (!top) return null
  const question = questionsAsked(round) < MIND_MAX_QUESTIONS ? bestQuestion(engine, round) : null
  if (!question || top.share >= engine.guessThreshold) return { kind: 'guess', player: top.player }
  return { kind: 'question', question }
}

/** End the round as lost if the game has nothing left to try (out of guesses or candidates). */
function settle(engine: MindEngine, round: MindRound): MindRound {
  if (round.status !== 'playing') return round
  const outOfGuesses = guessesMade(round) >= MIND_MAX_GUESSES
  const noCandidates = !scores(engine, round).some((x) => x > 0)
  return outOfGuesses || noCandidates ? { ...round, status: 'lost' } : round
}

/** Record the answer to the question the game asked. No-op if the round is over or it was asked. */
export function answerQuestion(
  engine: MindEngine,
  round: MindRound,
  questionId: string,
  answer: MindAnswer,
): MindRound {
  if (round.status !== 'playing' || !engine.questionIndex.has(questionId)) return round
  if (questionsAsked(round) >= MIND_MAX_QUESTIONS) return round
  if (round.turns.some((t) => t.kind === 'question' && t.questionId === questionId)) return round
  return settle(engine, {
    ...round,
    turns: [...round.turns, { kind: 'question', questionId, answer }],
  })
}

/** Record whether the game's guess was right. No-op if the round is over or it was guessed. */
export function answerGuess(
  engine: MindEngine,
  round: MindRound,
  playerId: string,
  correct: boolean,
): MindRound {
  if (round.status !== 'playing' || !engine.playerIndex.has(playerId)) return round
  if (guessesMade(round) >= MIND_MAX_GUESSES) return round
  if (round.turns.some((t) => t.kind === 'guess' && t.playerId === playerId)) return round
  const turns: MindTurn[] = [...round.turns, { kind: 'guess', playerId, correct }]
  if (correct) return { ...round, turns, status: 'won' }
  return settle(engine, { ...round, turns })
}

/** The user stops the round: the game loses. */
export function concede(round: MindRound): MindRound {
  return round.status === 'playing' ? { ...round, status: 'lost' } : round
}

/** After a loss, the user says who they were thinking of. */
export function reveal(engine: MindEngine, round: MindRound, playerId: string): MindRound {
  if (round.status !== 'lost' || !engine.playerIndex.has(playerId)) return round
  return round.revealedId === playerId ? round : { ...round, revealedId: playerId }
}

export interface Mismatch {
  question: Question
  said: 'yes' | 'no'
}

/** Answers that disagree with a player's data (to explain a loss). */
export function mismatches(engine: MindEngine, round: MindRound, playerId: string): Mismatch[] {
  const pi = engine.playerIndex.get(playerId)
  if (pi === undefined) return []
  const n = engine.players.length
  return round.turns.flatMap((t) => {
    if (t.kind !== 'question' || t.answer === 'unsure') return []
    const qi = engine.questionIndex.get(t.questionId)
    if (qi === undefined) return []
    const data = engine.answers[qi * n + pi]
    const question = engine.questions[qi]
    if (data === -1 || !question || data === (t.answer === 'yes' ? 1 : 0)) return []
    return [{ question, said: t.answer }]
  })
}

/** Is this a structurally valid saved round for this engine? */
export function isValidMindRound(v: unknown, engine: MindEngine): v is MindRound {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  if (typeof r.roundId !== 'string' || !Array.isArray(r.turns)) return false
  if (r.status !== 'playing' && r.status !== 'won' && r.status !== 'lost') return false
  if (
    r.revealedId !== null &&
    !(typeof r.revealedId === 'string' && engine.playerIndex.has(r.revealedId))
  ) {
    return false
  }
  return r.turns.every((t: unknown) => {
    if (typeof t !== 'object' || t === null) return false
    const turn = t as Record<string, unknown>
    if (turn.kind === 'question') {
      return (
        typeof turn.questionId === 'string' &&
        engine.questionIndex.has(turn.questionId) &&
        (turn.answer === 'yes' || turn.answer === 'no' || turn.answer === 'unsure')
      )
    }
    return (
      turn.kind === 'guess' &&
      typeof turn.playerId === 'string' &&
      engine.playerIndex.has(turn.playerId) &&
      typeof turn.correct === 'boolean'
    )
  })
}
