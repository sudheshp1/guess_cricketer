import type { Player } from '../types'
import { getPuzzleNumber } from './date'
import { PLAYERS_BY_ID, SCHEDULE } from './players'

/** The answer for a puzzle number (1-based), cycling through the schedule. */
export function getAnswer(
  puzzleNumber: number,
  schedule: readonly string[] = SCHEDULE,
  playersById: ReadonlyMap<string, Player> = PLAYERS_BY_ID,
): Player {
  if (schedule.length === 0) throw new Error('Puzzle schedule is empty')
  const index = (((puzzleNumber - 1) % schedule.length) + schedule.length) % schedule.length
  const id = schedule[index]!
  const player = playersById.get(id)
  if (!player) throw new Error(`Schedule refers to unknown player "${id}"`)
  return player
}

export interface Puzzle {
  puzzleNumber: number
  answer: Player
}

export function getTodaysPuzzle(now: Date = new Date()): Puzzle {
  const puzzleNumber = getPuzzleNumber(now)
  return { puzzleNumber, answer: getAnswer(puzzleNumber) }
}
