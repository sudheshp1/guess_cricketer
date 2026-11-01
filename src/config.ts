/** All tunable game constants live here. */

/** Name shown in the UI and share text. */
export const GAME_NAME = 'Cricdle'

/** Public URL appended to the share text. */
export const SITE_URL = 'https://guess-cricketer.vercel.app'

/** Puzzle #1 is played on this Asia/Kolkata calendar date (YYYY-MM-DD). */
export const LAUNCH_DATE = '2026-11-01'

/** Time zone that defines the daily rollover for everyone. */
export const PUZZLE_TIME_ZONE = 'Asia/Kolkata'

export const MAX_GUESSES = 8

/** Debut year within ±N years of the answer counts as "close". */
export const DEBUT_YEAR_CLOSE_RANGE = 3

/** International match count within ±N of the answer counts as "close". */
export const INTL_MATCHES_CLOSE_RANGE = 25

/** Max suggestions shown in the autocomplete dropdown. */
export const MAX_SEARCH_RESULTS = 8

/** Delay between each cell's flip animation, in ms. */
export const FLIP_STAGGER_MS = 150
