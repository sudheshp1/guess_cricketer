import { MIND_MAX_QUESTIONS } from '../config'
import type { MindStats } from '../types'
import { questionsAsked, type MindRound } from './mind'

export function emptyMindStats(maxQuestions = MIND_MAX_QUESTIONS): MindStats {
  return {
    played: 0,
    gameWins: 0,
    distribution: Array.from({ length: maxQuestions }, () => 0),
    lastRoundId: null,
  }
}

/**
 * Record a finished Mind Reader round. Pure: returns new stats, or the same object if the round
 * is still in progress or was already recorded (reload guard). Revealing a player afterwards
 * doesn't record again.
 */
export function recordMindRound(stats: MindStats, round: MindRound): MindStats {
  if (round.status === 'playing' || stats.lastRoundId === round.roundId) return stats
  const won = round.status === 'won'
  const distribution = [...stats.distribution]
  if (won && distribution.length > 0) {
    const slot = Math.min(Math.max(questionsAsked(round), 1), distribution.length) - 1
    distribution[slot] = (distribution[slot] ?? 0) + 1
  }
  return {
    played: stats.played + 1,
    gameWins: stats.gameWins + (won ? 1 : 0),
    distribution,
    lastRoundId: round.roundId,
  }
}

/** Share of rounds the game won, as a whole percentage. */
export function gameWinPercentage(stats: MindStats): number {
  return stats.played === 0 ? 0 : Math.round((stats.gameWins / stats.played) * 100)
}

/** Average questions the game needed on its wins, or null with no wins. */
export function averageQuestions(stats: MindStats): number | null {
  if (stats.gameWins === 0) return null
  const total = stats.distribution.reduce((sum, count, i) => sum + count * (i + 1), 0)
  return Math.round((total / stats.gameWins) * 10) / 10
}
