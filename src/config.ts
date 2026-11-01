/** All tunable game constants live here. */

/** Name shown in the UI and share text. */
export const GAME_NAME = 'Cricdle'

/** Public URL appended to the share text. */
export const SITE_URL = 'https://guess-cricketer.vercel.app'

/** Puzzle #1 is played on this IST calendar date (YYYY-MM-DD). */
export const LAUNCH_DATE = '2026-11-01'

/**
 * The daily rollover is midnight in Asia/Kolkata (IST) for everyone. IST is a fixed UTC+05:30 with
 * no daylight saving, so a constant offset is exact.
 */
export const PUZZLE_UTC_OFFSET_MINUTES = 330

export const MAX_GUESSES = 8

/** Debut year within ±N years of the answer counts as "close". */
export const DEBUT_YEAR_CLOSE_RANGE = 3

/** International match count within ±N of the answer counts as "close". */
export const INTL_MATCHES_CLOSE_RANGE = 25

/** Max suggestions shown in the autocomplete dropdown. */
export const MAX_SEARCH_RESULTS = 8

/** Delay between each cell's flip animation, in ms. */
export const FLIP_STAGGER_MS = 150

/** localStorage keys. Bump the version suffix if the stored shape changes incompatibly. */
export const STORAGE_KEYS = {
  game: 'cricdle:game:v1',
  stats: 'cricdle:stats:v1',
  seenHelp: 'cricdle:seenHelp:v1',
} as const
