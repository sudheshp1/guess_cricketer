import { LAUNCH_DATE, PUZZLE_UTC_OFFSET_MINUTES } from '../config'

const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000
const OFFSET_MS = PUZZLE_UTC_OFFSET_MINUTES * MS_PER_MINUTE

/** The puzzle calendar date (IST) for an instant, as YYYY-MM-DD. */
export function puzzleDateString(now: Date): string {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10)
}

/** Whole days from LAUNCH_DATE to the given IST date string (may be negative). */
function daysSinceLaunch(dateString: string, launchDate = LAUNCH_DATE): number {
  return Math.round((Date.parse(dateString) - Date.parse(launchDate)) / MS_PER_DAY)
}

/**
 * Puzzle number for an instant: 1 on LAUNCH_DATE (IST), 2 the day after, and so on. Before launch
 * it stays at 1 so early visitors still get a playable puzzle.
 */
export function getPuzzleNumber(now: Date, launchDate = LAUNCH_DATE): number {
  return Math.max(0, daysSinceLaunch(puzzleDateString(now), launchDate)) + 1
}

/** Milliseconds until the next IST midnight, when the next puzzle unlocks. */
export function msUntilNextPuzzle(now: Date): number {
  const shifted = now.getTime() + OFFSET_MS
  const nextMidnightShifted = (Math.floor(shifted / MS_PER_DAY) + 1) * MS_PER_DAY
  return nextMidnightShifted - shifted
}

/** Format a duration as HH:MM:SS (rounding up, so it never shows 00:00:00 early). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
