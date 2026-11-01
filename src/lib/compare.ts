import { DEBUT_YEAR_CLOSE_RANGE, INTL_MATCHES_CLOSE_RANGE } from '../config'
import {
  PACE_TYPES,
  SPIN_TYPES,
  type BowlingType,
  type CellFeedback,
  type Direction,
  type GuessResult,
  type Match,
  type Player,
  type Role,
} from '../types'

/** Pairs of roles that count as "close" (order doesn't matter). */
const RELATED_ROLES: ReadonlyArray<readonly [Role, Role]> = [
  ['Batter', 'Wicketkeeper-Batter'],
  ['All-rounder', 'Batter'],
  ['All-rounder', 'Bowler'],
]

export function compareRole(guess: Role, answer: Role): Match {
  if (guess === answer) return 'correct'
  const related = RELATED_ROLES.some(
    ([a, b]) => (a === guess && b === answer) || (a === answer && b === guess),
  )
  return related ? 'close' : 'wrong'
}

export type BowlingFamily = 'pace' | 'spin' | 'none'

export function bowlingFamily(type: BowlingType): BowlingFamily {
  if ((PACE_TYPES as readonly string[]).includes(type)) return 'pace'
  if ((SPIN_TYPES as readonly string[]).includes(type)) return 'spin'
  return 'none'
}

export function compareBowling(guess: BowlingType, answer: BowlingType): Match {
  if (guess === answer) return 'correct'
  const family = bowlingFamily(guess)
  // "None" only ever matches "None", which the equality check above already covered.
  if (family !== 'none' && family === bowlingFamily(answer)) return 'close'
  return 'wrong'
}

export function compareNumber(
  guess: number,
  answer: number,
  closeRange: number,
): { match: Match; direction: Direction } {
  if (guess === answer) return { match: 'correct', direction: null }
  return {
    match: Math.abs(guess - answer) <= closeRange ? 'close' : 'wrong',
    // "up" means the answer is higher than the guess.
    direction: answer > guess ? 'up' : 'down',
  }
}

const exact = <T>(guess: T, answer: T): Match => (guess === answer ? 'correct' : 'wrong')

/** Compare a guessed player with the answer, one cell per attribute, in display order. */
export function compare(guess: Player, answer: Player): GuessResult {
  const debut = compareNumber(guess.debutYear, answer.debutYear, DEBUT_YEAR_CLOSE_RANGE)
  const matches = compareNumber(guess.intlMatches, answer.intlMatches, INTL_MATCHES_CLOSE_RANGE)

  const cells: CellFeedback[] = [
    {
      key: 'country',
      value: guess.country,
      match: exact(guess.country, answer.country),
      direction: null,
    },
    {
      key: 'role',
      value: guess.role,
      match: compareRole(guess.role, answer.role),
      direction: null,
    },
    {
      key: 'battingHand',
      value: guess.battingHand,
      match: exact(guess.battingHand, answer.battingHand),
      direction: null,
    },
    {
      key: 'bowlingType',
      value: guess.bowlingType,
      match: compareBowling(guess.bowlingType, answer.bowlingType),
      direction: null,
    },
    { key: 'debutYear', value: guess.debutYear, ...debut },
    { key: 'intlMatches', value: guess.intlMatches, ...matches },
    {
      key: 'active',
      value: guess.active,
      match: exact(guess.active, answer.active),
      direction: null,
    },
  ]

  return { playerId: guess.id, cells, isCorrect: guess.id === answer.id }
}
