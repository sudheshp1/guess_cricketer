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
  difficulty: Difficulty
}

export type Match = 'correct' | 'close' | 'wrong'
export type Direction = 'up' | 'down' | null

export type AttributeKey =
  'country' | 'role' | 'battingHand' | 'bowlingType' | 'debutYear' | 'intlMatches' | 'active'

export interface CellFeedback {
  key: AttributeKey
  /** The guessed player's value, displayed in the cell. */
  value: string | number | boolean
  match: Match
  /** Only set for numeric fields. */
  direction: Direction
}

export interface GuessResult {
  playerId: string
  cells: CellFeedback[]
  isCorrect: boolean
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface SavedGame {
  puzzleNumber: number
  /** Player ids, in order. */
  guesses: string[]
  status: GameStatus
}

export interface Stats {
  played: number
  wins: number
  currentStreak: number
  maxStreak: number
  /** Length MAX_GUESSES; wins by guess count. */
  distribution: number[]
  lastCompletedPuzzle: number | null
}
