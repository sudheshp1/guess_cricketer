import { MAX_CLUES } from '../config'
import type { Round, Stats } from '../types'

export function emptyStats(maxClues = MAX_CLUES): Stats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: Array.from({ length: maxClues }, () => 0),
    lastRoundId: null,
  }
}

/**
 * Record a finished round. Pure: returns new stats, or the same object if the round is still in
 * progress or was already recorded (reload guard).
 */
export function recordRound(stats: Stats, round: Round): Stats {
  if (round.status === 'playing' || stats.lastRoundId === round.roundId) return stats
  const won = round.status === 'won'
  const distribution = [...stats.distribution]
  if (won) {
    const slot = round.cluesRevealed - 1
    if (slot >= 0 && slot < distribution.length) distribution[slot] = (distribution[slot] ?? 0) + 1
  }
  const currentStreak = won ? stats.currentStreak + 1 : 0
  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastRoundId: round.roundId,
  }
}

export function winPercentage(stats: Stats): number {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100)
}

/** Average clue number of wins, or null with no wins. */
export function averageClues(stats: Stats): number | null {
  if (stats.wins === 0) return null
  const total = stats.distribution.reduce((sum, count, i) => sum + count * (i + 1), 0)
  return Math.round((total / stats.wins) * 10) / 10
}
