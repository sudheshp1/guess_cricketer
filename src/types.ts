export const COUNTRIES = [
  'Afghanistan',
  'Australia',
  'Bangladesh',
  'England',
  'India',
  'Ireland',
  'Netherlands',
  'New Zealand',
  'Pakistan',
  'Scotland',
  'South Africa',
  'Sri Lanka',
  'West Indies',
  'Zimbabwe',
] as const
export type Country = (typeof COUNTRIES)[number]

export const ROLES = ['Batter', 'Wicketkeeper-Batter', 'All-rounder', 'Bowler'] as const
export type Role = (typeof ROLES)[number]

export const BATTING_HANDS = ['Right', 'Left'] as const
export type BattingHand = (typeof BATTING_HANDS)[number]

export const PACE_TYPES = [
  'Right-arm fast',
  'Right-arm medium',
  'Left-arm fast',
  'Left-arm medium',
] as const
export const SPIN_TYPES = [
  'Right-arm off-spin',
  'Right-arm leg-spin',
  'Left-arm orthodox',
  'Left-arm wrist-spin',
] as const
export const BOWLING_TYPES = [...PACE_TYPES, ...SPIN_TYPES, 'None'] as const
export type BowlingType = (typeof BOWLING_TYPES)[number]

export type Difficulty = 1 | 2 | 3

export const FORMATS = ['test', 'odi', 't20i'] as const
export type Format = (typeof FORMATS)[number]

/** Career figures in one international format. Null where the source shows none. */
export interface FormatStats {
  matches: number
  runs: number | null
  highScore: string | null
  hundreds: number | null
  fifties: number | null
  wickets: number | null
  bestBowling: string | null
}

export interface Player {
  id: string
  name: string
  aliases: string[]
  country: Country
  role: Role
  battingHand: BattingHand
  bowlingType: BowlingType
  debutYear: number
  intlMatches: number
  active: boolean
  /** Year of the last international match, if known (for retired players). */
  lastYear: number | null
  difficulty: Difficulty
  /** Per-format career figures, only for formats the player played. */
  stats: Partial<Record<Format, FormatStats>>
  /** "As of" date of the career figures (from the Wikipedia infobox), if stated. */
  statsAsOf: string | null
}

/** Which players can be the answer: famous only, regular fans' level, or everyone. */
export type PlayerPool = 'famous' | 'regular' | 'all'

export type RoundStatus = 'playing' | 'won' | 'lost'

export interface Round {
  /** Unique per round; guards against recording stats twice. */
  roundId: string
  answerId: string
  /** Player ids guessed, in order. */
  guesses: string[]
  /** How many clues are visible (1..MAX_CLUES). */
  cluesRevealed: number
  status: RoundStatus
  /** True if the player gave up instead of running out of clues. */
  gaveUp: boolean
}

export interface Clue {
  key: ClueKey
  title: string
  text: string
  /** Optional small print, e.g. where the figures come from. */
  note?: string
}

export type ClueKey =
  | 'role'
  | 'country'
  | 'style'
  | 'debut'
  | 'status'
  | 'matches'
  | 'batting'
  | 'bowling'
  | 'milestones'
  | 'initials'

export interface Stats {
  played: number
  wins: number
  currentStreak: number
  maxStreak: number
  /** Length MAX_CLUES; wins by the clue number they were solved on. */
  distribution: number[]
  /** roundId of the last round recorded, to avoid double counting. */
  lastRoundId: string | null
}

// ---- Mind Reader mode: the user thinks of a player, the game asks yes/no questions. ----

/** How hard a question is for a typical fan to answer confidently. */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  /** Stable, kebab-case; stored in saved rounds, so never rename one. */
  id: string
  /** Asked about "your player"; never names anyone. */
  text: string
  difficulty: QuestionDifficulty
  /** The true answer for a player, or null if the data can't say. */
  test: (player: Player) => boolean | null
}

export type MindAnswer = 'yes' | 'no' | 'unsure'
