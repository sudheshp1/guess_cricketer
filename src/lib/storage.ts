import { MAX_GUESSES, STORAGE_KEYS } from '../config'
import type { SavedGame, Stats } from '../types'
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

function isSavedGame(v: unknown): v is SavedGame {
  if (typeof v !== 'object' || v === null) return false
  const g = v as Record<string, unknown>
  return (
    typeof g.puzzleNumber === 'number' &&
    Array.isArray(g.guesses) &&
    g.guesses.every((id) => typeof id === 'string') &&
    (g.status === 'playing' || g.status === 'won' || g.status === 'lost')
  )
}

/** The saved game for this puzzle, or null if there is none (or it's for another day). */
export function loadGame(
  puzzleNumber: number,
  store: KeyValueStore | null = defaultStore(),
): SavedGame | null {
  const saved = readJson(STORAGE_KEYS.game, store)
  if (!isSavedGame(saved) || saved.puzzleNumber !== puzzleNumber) return null
  return saved
}

export function saveGame(game: SavedGame, store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.game, game, store)
}

function isStats(v: unknown): v is Stats {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  const nums = ['played', 'wins', 'currentStreak', 'maxStreak'] as const
  return (
    nums.every((k) => typeof s[k] === 'number' && Number.isFinite(s[k])) &&
    Array.isArray(s.distribution) &&
    s.distribution.every((n) => typeof n === 'number') &&
    (s.lastCompletedPuzzle === null || typeof s.lastCompletedPuzzle === 'number')
  )
}

export function loadStats(store: KeyValueStore | null = defaultStore()): Stats {
  const saved = readJson(STORAGE_KEYS.stats, store)
  if (!isStats(saved)) return emptyStats()
  // Normalise the distribution length in case MAX_GUESSES changed.
  const distribution = Array.from({ length: MAX_GUESSES }, (_, i) => saved.distribution[i] ?? 0)
  return { ...saved, distribution }
}

export function saveStats(stats: Stats, store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.stats, stats, store)
}

export function hasSeenHelp(store: KeyValueStore | null = defaultStore()): boolean {
  return readJson(STORAGE_KEYS.seenHelp, store) === true
}

export function markHelpSeen(store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(STORAGE_KEYS.seenHelp, true, store)
}
