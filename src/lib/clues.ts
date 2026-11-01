import type { BowlingType, Clue, Format, FormatStats, Player, Role } from '../types'
import { FORMATS } from '../types'

const FORMAT_NAMES: Record<Format, { one: string; many: string }> = {
  test: { one: 'Test', many: 'Tests' },
  odi: { one: 'ODI', many: 'ODIs' },
  t20i: { one: 'T20I', many: 'T20Is' },
}

const ROLE_TEXT: Record<Role, string> = {
  Batter: 'Batter',
  'Wicketkeeper-Batter': 'Wicketkeeper-batter',
  'All-rounder': 'All-rounder',
  Bowler: 'Bowler',
}

const n = (value: number) => value.toLocaleString('en-US')

/** Formats the player played, in Test / ODI / T20I order. */
function playedFormats(player: Player): [Format, FormatStats][] {
  return FORMATS.flatMap((f) => {
    const s = player.stats[f]
    return s ? [[f, s] as [Format, FormatStats]] : []
  })
}

/** "254*" beats "254", which beats "253*". */
function scoreValue(score: string): number {
  return Number.parseInt(score, 10) + (score.endsWith('*') ? 0.5 : 0)
}

/** "5/23" beats "5/30", which beats "4/10". */
function bowlingValue(best: string): number {
  const [w, r] = best.split('/').map(Number)
  return (w ?? 0) * 1000 - (r ?? 0)
}

function bowlingStyle(type: BowlingType): string {
  if (type === 'None') return "doesn't bowl"
  return `bowls ${type.charAt(0).toLowerCase()}${type.slice(1)}`
}

/** "AB de Villiers" -> "A_ d_ V_______": first letters and word lengths. */
export function nameShape(name: string): string {
  return name
    .split(' ')
    .map((word) => [...word].map((ch, i) => (i === 0 || !/\p{L}/u.test(ch) ? ch : '_')).join(''))
    .join('  ')
}

function statsNote(player: Player): string {
  return player.statsAsOf
    ? `Career figures from Wikipedia, as of ${player.statsAsOf}.`
    : 'Career figures from Wikipedia.'
}

function battingClue(player: Player): string {
  const parts = playedFormats(player)
    .filter(([, s]) => s.runs !== null)
    .map(([f, s]) => `${n(s.runs!)} in ${FORMAT_NAMES[f].many}`)
  if (parts.length === 0) return 'No international batting figures available.'
  let best: { score: string; format: Format } | null = null
  for (const [f, s] of playedFormats(player)) {
    if (s.highScore && (!best || scoreValue(s.highScore) > scoreValue(best.score))) {
      best = { score: s.highScore, format: f }
    }
  }
  const high = best ? ` · Highest score ${best.score} (${FORMAT_NAMES[best.format].one})` : ''
  return `Runs: ${parts.join(', ')}${high}`
}

function bowlingClue(player: Player): string {
  const withWickets = playedFormats(player).filter(([, s]) => s.wickets !== null)
  const total = withWickets.reduce((sum, [, s]) => sum + (s.wickets ?? 0), 0)
  if (withWickets.length === 0) return 'Never bowled in international cricket.'
  if (total === 0) return 'No international wickets.'
  const parts = withWickets.map(([f, s]) => `${n(s.wickets!)} in ${FORMAT_NAMES[f].many}`)
  let best: { figures: string; format: Format } | null = null
  for (const [f, s] of playedFormats(player)) {
    if (s.bestBowling && (!best || bowlingValue(s.bestBowling) > bowlingValue(best.figures))) {
      best = { figures: s.bestBowling, format: f }
    }
  }
  const bestText = best ? ` · Best ${best.figures} (${FORMAT_NAMES[best.format].one})` : ''
  return `Wickets: ${parts.join(', ')}${bestText}`
}

function milestonesClue(player: Player): string {
  const formats = playedFormats(player).filter(([, s]) => s.hundreds !== null || s.fifties !== null)
  if (formats.length === 0) return 'No international hundreds or fifties on record.'
  const hundreds = formats.reduce((sum, [, s]) => sum + (s.hundreds ?? 0), 0)
  const fifties = formats.reduce((sum, [, s]) => sum + (s.fifties ?? 0), 0)
  const split = formats
    .filter(([, s]) => (s.hundreds ?? 0) > 0)
    .map(([f, s]) => `${s.hundreds} ${FORMAT_NAMES[f].one}`)
  const hundredsText =
    hundreds === 0
      ? 'No international hundreds'
      : `${n(hundreds)} international ${hundreds === 1 ? 'hundred' : 'hundreds'} (${split.join(', ')})`
  return `${hundredsText} · ${n(fifties)} ${fifties === 1 ? 'fifty' : 'fifties'}`
}

/** The ten clues for a player, from vaguest to most specific. */
export function buildClues(player: Player): Clue[] {
  const formats = playedFormats(player)
  const matchSplit = formats
    .map(
      ([f, s]) => `${n(s.matches)} ${s.matches === 1 ? FORMAT_NAMES[f].one : FORMAT_NAMES[f].many}`,
    )
    .join(', ')
  const hand = player.battingHand === 'Left' ? 'Left' : 'Right'

  return [
    { key: 'role', title: 'Role', text: ROLE_TEXT[player.role] },
    {
      key: 'country',
      title: 'Country',
      // Neutral wording: "Played for" would give away retirement before the status clue.
      text: player.country,
    },
    {
      key: 'style',
      title: 'Style',
      text: `${hand}-handed batter, ${bowlingStyle(player.bowlingType)}`,
    },
    { key: 'debut', title: 'Debut', text: `International debut in ${player.debutYear}` },
    {
      key: 'status',
      title: 'Status',
      text: player.active
        ? 'Still playing international cricket'
        : player.lastYear
          ? `Retired · last international match in ${player.lastYear}`
          : 'Retired from international cricket',
    },
    {
      key: 'matches',
      title: 'Matches',
      text: `${n(player.intlMatches)} international matches${matchSplit ? ` (${matchSplit})` : ''}`,
    },
    { key: 'batting', title: 'Batting', text: battingClue(player), note: statsNote(player) },
    { key: 'bowling', title: 'Bowling', text: bowlingClue(player), note: statsNote(player) },
    {
      key: 'milestones',
      title: 'Milestones',
      text: milestonesClue(player),
      note: statsNote(player),
    },
    { key: 'initials', title: 'Name', text: nameShape(player.name) },
  ]
}
