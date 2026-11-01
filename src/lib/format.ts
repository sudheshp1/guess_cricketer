import type { AttributeKey, BowlingType, CellFeedback, Country, Match, Role } from '../types'

export const COLUMN_LABELS: Record<AttributeKey, { short: string; full: string }> = {
  country: { short: 'Team', full: 'Country' },
  role: { short: 'Role', full: 'Role' },
  battingHand: { short: 'Bat', full: 'Batting hand' },
  bowlingType: { short: 'Bowl', full: 'Bowling type' },
  debutYear: { short: 'Debut', full: 'Debut year' },
  intlMatches: { short: 'Mat', full: 'International matches' },
  active: { short: 'Status', full: 'Status' },
}

export const COUNTRY_CODES: Record<Country, string> = {
  Afghanistan: 'AFG',
  Australia: 'AUS',
  Bangladesh: 'BAN',
  England: 'ENG',
  India: 'IND',
  Ireland: 'IRE',
  Netherlands: 'NED',
  'New Zealand': 'NZ',
  Pakistan: 'PAK',
  Scotland: 'SCO',
  'South Africa': 'SA',
  'Sri Lanka': 'SL',
  'West Indies': 'WI',
  Zimbabwe: 'ZIM',
}

export const ROLE_CODES: Record<Role, string> = {
  Batter: 'BAT',
  'Wicketkeeper-Batter': 'WK',
  'All-rounder': 'AR',
  Bowler: 'BOWL',
}

export const BOWLING_CODES: Record<BowlingType, string> = {
  'Right-arm fast': 'RF',
  'Right-arm medium': 'RM',
  'Left-arm fast': 'LF',
  'Left-arm medium': 'LM',
  'Right-arm off-spin': 'OB',
  'Right-arm leg-spin': 'LB',
  'Left-arm orthodox': 'SLA',
  'Left-arm wrist-spin': 'SLC',
  None: '—',
}

/** Short text for the cell and the full text for tooltips and screen readers. */
export function formatValue(cell: Pick<CellFeedback, 'key' | 'value'>): {
  short: string
  full: string
} {
  const { key, value } = cell
  switch (key) {
    case 'country':
      return { short: COUNTRY_CODES[value as Country] ?? String(value), full: String(value) }
    case 'role':
      return { short: ROLE_CODES[value as Role] ?? String(value), full: String(value) }
    case 'battingHand':
      return {
        short: value === 'Left' ? 'LHB' : 'RHB',
        full: `${String(value)}-handed batter`,
      }
    case 'bowlingType':
      return {
        short: BOWLING_CODES[value as BowlingType] ?? String(value),
        full: value === 'None' ? 'Does not bowl' : String(value),
      }
    case 'debutYear':
      return { short: String(value), full: `Debut ${String(value)}` }
    case 'intlMatches':
      return { short: String(value), full: `${String(value)} international matches` }
    case 'active':
      return value ? { short: 'Active', full: 'Active' } : { short: 'Retired', full: 'Retired' }
  }
}

const MATCH_WORDS: Record<Match, string> = {
  correct: 'correct',
  close: 'close',
  wrong: 'not a match',
}

/** One-sentence screen reader description of a cell, e.g. "Debut 2008: close, answer is later". */
export function describeCell(cell: CellFeedback): string {
  const { full } = formatValue(cell)
  let text = `${COLUMN_LABELS[cell.key].full}: ${full}, ${MATCH_WORDS[cell.match]}`
  if (cell.direction) {
    const higher = cell.key === 'debutYear' ? 'later' : 'more'
    const lower = cell.key === 'debutYear' ? 'earlier' : 'fewer'
    text += `, answer is ${cell.direction === 'up' ? higher : lower}`
  }
  return text
}
