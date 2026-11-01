import { MAX_CLUES } from '../config'
import type { Player, PlayerPool, Round } from '../types'

/** Highest player difficulty allowed as an answer in each pool. */
export const POOL_MAX_DIFFICULTY: Record<PlayerPool, number> = { famous: 1, regular: 2, all: 3 }

/**
 * Pick a random answer from the pool, avoiding recent answers when possible. `random` returns
 * [0, 1) and is injectable for tests.
 */
export function pickAnswer(
  players: readonly Player[],
  pool: PlayerPool,
  recentIds: readonly string[],
  random: () => number = Math.random,
): Player {
  const eligible = players.filter((p) => p.difficulty <= POOL_MAX_DIFFICULTY[pool])
  if (eligible.length === 0) throw new Error('No players available for this pool')
  const recent = new Set(recentIds)
  const fresh = eligible.filter((p) => !recent.has(p.id))
  const candidates = fresh.length > 0 ? fresh : eligible
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))]!
}

export function newRound(answerId: string, roundId: string): Round {
  return { roundId, answerId, guesses: [], cluesRevealed: 1, status: 'playing', gaveUp: false }
}

/**
 * Apply a guess. A correct guess wins; a wrong one reveals the next clue, or ends the round if
 * every clue was already showing. Returns the same object for a disallowed guess.
 */
export function guess(round: Round, playerId: string, maxClues = MAX_CLUES): Round {
  if (round.status !== 'playing' || round.guesses.includes(playerId)) return round
  const guesses = [...round.guesses, playerId]
  if (playerId === round.answerId) return { ...round, guesses, status: 'won' }
  if (round.cluesRevealed >= maxClues) return { ...round, guesses, status: 'lost' }
  return { ...round, guesses, cluesRevealed: round.cluesRevealed + 1 }
}

/** Reveal the next clue without guessing. No-op once all clues are showing. */
export function revealClue(round: Round, maxClues = MAX_CLUES): Round {
  if (round.status !== 'playing' || round.cluesRevealed >= maxClues) return round
  return { ...round, cluesRevealed: round.cluesRevealed + 1 }
}

export function giveUp(round: Round): Round {
  if (round.status !== 'playing') return round
  return { ...round, status: 'lost', gaveUp: true }
}

/** Restored rounds must point at a known player and have sane numbers. */
export function isValidRound(
  round: Round,
  isKnown: (id: string) => boolean,
  maxClues = MAX_CLUES,
): boolean {
  return (
    isKnown(round.answerId) &&
    round.cluesRevealed >= 1 &&
    round.cluesRevealed <= maxClues &&
    round.guesses.every(isKnown)
  )
}
