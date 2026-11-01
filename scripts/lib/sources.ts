/** Shapes of the committed source snapshots in scripts/sources/. */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv } from './csv.ts'

export const SCRIPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
export const ROOT_DIR = join(SCRIPTS_DIR, '..')
export const SOURCES_DIR = join(SCRIPTS_DIR, 'sources')
export const CACHE_DIR = join(SCRIPTS_DIR, '.cache')
export const SEED_PATH = join(SCRIPTS_DIR, 'players-seed.csv')
export const WIKIPEDIA_PATH = join(SOURCES_DIR, 'wikipedia.json')
export const CRICSHEET_PATH = join(SOURCES_DIR, 'cricsheet.json')
export const REPORT_PATH = join(SOURCES_DIR, 'report.md')
export const PLAYERS_PATH = join(ROOT_DIR, 'src', 'data', 'players.json')
export const SCHEDULE_PATH = join(ROOT_DIR, 'src', 'data', 'schedule.json')

export interface WikipediaPage {
  /** Title as written in the seed CSV. */
  requested: string
  /** Final title after redirects. */
  title: string
  revid: number
  infobox: string
  cricinfoId: string | null
  /**
   * T20I match count from "List of <country> Twenty20 International cricketers", fetched only
   * when the infobox has no T20I column (it shows at most four columns).
   */
  t20iFromList?: { page: string; revid: number; matches: number }
}

export interface WikipediaSnapshot {
  fetchedAt: string
  pages: Record<string, WikipediaPage>
}

export interface CricsheetPlayer {
  cricsheetId: string
  tests: number
  odis: number
  t20is: number
  firstDate: string
  lastDate: string
  teams: string[]
}

export interface CricsheetSnapshot {
  fetchedAt: string
  /** Latest match date present in the downloaded archives. */
  latestMatch: string
  players: Record<string, CricsheetPlayer>
}

export interface SeedRow {
  id: string
  name: string
  wikipedia: string
  aliases: string
  difficulty: string
  country: string
  role: string
  battingHand: string
  bowlingType: string
  debutYear: string
  intlMatches: string
  active: string
  todo_verify: string
  notes: string
}

export function readSeed(): SeedRow[] {
  return parseCsv(readFileSync(SEED_PATH, 'utf8')) as unknown as SeedRow[]
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}
