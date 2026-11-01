/**
 * Build src/data/schedule.json: a seeded shuffle of every answer-eligible player (difficulty 1-2),
 * one per day. The app plays schedule[puzzleNumber % schedule.length].
 *
 * Each player appears once per cycle, so no answer repeats within schedule.length days. The build
 * fails if that is under MIN_REPEAT_GAP_DAYS, unless --allow-short is passed (small dev data sets).
 *
 * Once the game is live, regenerating reshuffles future answers; keep SEED fixed and only append.
 */
import { writeFileSync } from 'node:fs'
import type { Player } from '../src/types.ts'
import { PLAYERS_PATH, SCHEDULE_PATH, readJson } from './lib/sources.ts'
import { seededShuffle } from './lib/shuffle.ts'
import { validateSchedule } from './lib/validate.ts'

const SEED = 'cricdle-v1'
const MIN_REPEAT_GAP_DAYS = 365

const players = readJson<Player[]>(PLAYERS_PATH)
const pool = players
  .filter((p) => p.difficulty <= 2)
  .map((p) => p.id)
  .sort()
const schedule = seededShuffle(pool, SEED)

const errors = validateSchedule(schedule, players, MIN_REPEAT_GAP_DAYS)
if (errors.length > 0) {
  console.error(`schedule is invalid:\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
if (schedule.length < MIN_REPEAT_GAP_DAYS) {
  const msg = `only ${schedule.length} answer-eligible players; answers repeat every ${schedule.length} days (need ${MIN_REPEAT_GAP_DAYS})`
  if (!process.argv.includes('--allow-short')) {
    console.error(`schedule too short: ${msg}`)
    process.exit(1)
  }
  console.warn(`Warning: ${msg}`)
}

writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2) + '\n')
console.log(`Wrote ${schedule.length}-day schedule -> src/data/schedule.json`)
