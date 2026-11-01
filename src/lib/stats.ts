import { MAX_GUESSES } from '../config'
import type { Stats } from '../types'

export function emptyStats(maxGuesses = MAX_GUESSES): Stats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: Array.from({ length: maxGuesses }, () => 0),
    lastCompletedPuzzle: null,
  }
}

/**
 * Record a finished game. Pure: returns new stats. Recording the same puzzle twice is a no-op,
 * which guards against double counting after a reload.
 */
export function applyGameResult(
  stats: Stats,
  puzzleNumber: number,
  won: boolean,
  guessCount: number,
): Stats {
  if (stats.lastCompletedPuzzle === puzzleNumber) return stats

  const distribution = [...stats.distribution]
  let currentStreak = 0
  if (won) {
    currentStreak = stats.lastCompletedPuzzle === puzzleNumber - 1 ? stats.currentStreak + 1 : 1
    const slot = guessCount - 1
    if (slot >= 0 && slot < distribution.length) distribution[slot] = (distribution[slot] ?? 0) + 1
  }

  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastCompletedPuzzle: puzzleNumber,
  }
}

/**
 * The streak to display today: a streak only survives if yesterday's (or today's) puzzle was
 * completed. Stored stats are not rewritten; this just avoids showing a stale streak.
 */
export function displayedStreak(stats: Stats, todaysPuzzle: number): number {
  const last = stats.lastCompletedPuzzle
  if (last === null) return 0
  return last >= todaysPuzzle - 1 ? stats.currentStreak : 0
}

export function winPercentage(stats: Stats): number {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100)
}
