import { MAX_CLUES, MIND_MAX_QUESTIONS, RECENT_ANSWER_MEMORY, STORAGE_KEYS } from '../config'
import type { GameMode, MindStats, PlayerPool, Round, Stats } from '../types'
import { emptyMindStats } from './mindStats'
import { emptyStats } from './stats'

/** The subset of the Storage API we use; injectable for tests. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** localStorage, or null if it is unavailable (privacy mode, disabled cookies, SSR). */
function defaultStore(): KeyValueStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function readJson(key: string, store: KeyValueStore | null): unknown {
  if (!store) return null
  try {
    const raw = store.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

/** Returns false if the write failed; the game keeps working in memory either way. */
function writeJson(key: string, value: unknown, store: KeyValueStore | null): boolean {
  if (!store) return false
  try {
    store.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function isRound(v: unknown): v is Round {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.roundId === 'string' &&
    typeof r.answerId === 'string' &&
    Array.isArray(r.guesses) &&
    r.guesses.every((id) => typeof id === 'string') &&
    typeof r.cluesRevealed === 'number' &&
    (r.status === 'playing' || r.status === 'won' || r.status === 'lost') &&
    typeof r.gaveUp === 'boolean'
  )
}

export function loadRound(store: KeyValueStore | null = defaultStore()): Round | null {
  const saved = readJson(STORAGE_KEYS.round, store)
  return isRound(saved) ? saved : null
}

export function saveRound(round: Round, store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.round, round, store)
}

function isStats(v: unknown): v is Stats {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  const nums = ['played', 'wins', 'currentStreak', 'maxStreak'] as const
  return (
    nums.every((k) => typeof s[k] === 'number' && Number.isFinite(s[k])) &&
    Array.isArray(s.distribution) &&
    s.distribution.every((n) => typeof n === 'number') &&
    (s.lastRoundId === null || typeof s.lastRoundId === 'string')
  )
}

export function loadStats(store: KeyValueStore | null = defaultStore()): Stats {
  const saved = readJson(STORAGE_KEYS.stats, store)
  if (!isStats(saved)) return emptyStats()
  // Normalise the distribution length in case MAX_CLUES changed.
  const distribution = Array.from({ length: MAX_CLUES }, (_, i) => saved.distribution[i] ?? 0)
  return { ...saved, distribution }
}

export function saveStats(stats: Stats, store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.stats, stats, store)
}

/** Most recent answer ids, newest last. */
export function loadRecent(store: KeyValueStore | null = defaultStore()): string[] {
  const saved = readJson(STORAGE_KEYS.recent, store)
  return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
}

/** Append an answer to the recent list, keeping only the last RECENT_ANSWER_MEMORY ids. */
export function rememberAnswer(
  recent: readonly string[],
  answerId: string,
  store: KeyValueStore | null = defaultStore(),
): string[] {
  const next = [...recent.filter((id) => id !== answerId), answerId].slice(-RECENT_ANSWER_MEMORY)
  writeJson(STORAGE_KEYS.recent, next, store)
  return next
}

const POOLS: readonly PlayerPool[] = ['famous', 'regular', 'all']

export function loadPool(store: KeyValueStore | null = defaultStore()): PlayerPool {
  const saved = readJson(STORAGE_KEYS.pool, store)
  return POOLS.includes(saved as PlayerPool) ? (saved as PlayerPool) : 'regular'
}

export function savePool(pool: PlayerPool, store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.pool, pool, store)
}

export function hasSeenHelp(store: KeyValueStore | null = defaultStore()): boolean {
  return readJson(STORAGE_KEYS.seenHelp, store) === true
}

export function markHelpSeen(store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.seenHelp, true, store)
}

export function loadMode(store: KeyValueStore | null = defaultStore()): GameMode {
  return readJson(STORAGE_KEYS.mode, store) === 'mind' ? 'mind' : 'clues'
}

export function saveMode(mode: GameMode, store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.mode, mode, store)
}

/** The saved Mind Reader round, unvalidated (the hook checks it against the engine). */
export function loadMindRound(store: KeyValueStore | null = defaultStore()): unknown {
  return readJson(STORAGE_KEYS.mindRound, store)
}

export function saveMindRound(
  round: unknown,
  store: KeyValueStore | null = defaultStore(),
): boolean {
  return writeJson(STORAGE_KEYS.mindRound, round, store)
}

function isMindStats(v: unknown): v is MindStats {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return (
    typeof s.played === 'number' &&
    Number.isFinite(s.played) &&
    typeof s.gameWins === 'number' &&
    Number.isFinite(s.gameWins) &&
    Array.isArray(s.distribution) &&
    s.distribution.every((n) => typeof n === 'number') &&
    (s.lastRoundId === null || typeof s.lastRoundId === 'string')
  )
}

export function loadMindStats(store: KeyValueStore | null = defaultStore()): MindStats {
  const saved = readJson(STORAGE_KEYS.mindStats, store)
  if (!isMindStats(saved)) return emptyMindStats()
  // Normalise the distribution length in case MIND_MAX_QUESTIONS changed.
  const distribution = Array.from(
    { length: MIND_MAX_QUESTIONS },
    (_, i) => saved.distribution[i] ?? 0,
  )
  return { ...saved, distribution }
}

export function saveMindStats(
  stats: MindStats,
  store: KeyValueStore | null = defaultStore(),
): boolean {
  return writeJson(STORAGE_KEYS.mindStats, stats, store)
}
