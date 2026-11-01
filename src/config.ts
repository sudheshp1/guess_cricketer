/** All tunable game constants live here. */

/** Name shown in the UI and share text. */
export const GAME_NAME = 'Cricdle'

/** Public URL appended to the share text. Set VITE_SITE_URL in .env (also used in index.html). */
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://guess-cricketer.vercel.app'

/** Clues per round. One is shown at the start; each wrong guess (or skip) reveals the next. */
export const MAX_CLUES = 10

/** Don't repeat any of the last N answers (when the pool is big enough). */
export const RECENT_ANSWER_MEMORY = 50

/** Max suggestions shown in the autocomplete dropdown. */
export const MAX_SEARCH_RESULTS = 8

/** localStorage keys. Bump the version suffix if the stored shape changes incompatibly. */
export const STORAGE_KEYS = {
  round: 'cricdle:round:v2',
  stats: 'cricdle:stats:v2',
  recent: 'cricdle:recent:v2',
  pool: 'cricdle:pool:v2',
  seenHelp: 'cricdle:seenHelp:v2',
} as const
