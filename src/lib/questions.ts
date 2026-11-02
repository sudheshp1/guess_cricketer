import type { Country, Format, FormatStats, Player, Question, QuestionDifficulty } from '../types'
import { COUNTRIES, FORMATS, SPIN_TYPES } from '../types'

/**
 * The yes/no questions Mind Reader can ask. Every question uses round, fan-friendly thresholds and
 * returns null when the data can't answer it for a player (null never counts as a contradiction).
 */

type Stat = 'runs' | 'wickets' | 'hundreds'

const FORMAT_LABEL: Record<Format, string> = { test: 'Test', odi: 'ODI', t20i: 'T20I' }

const n = (value: number) => value.toLocaleString('en-US')

/** Formats the player played. */
function formats(p: Player): FormatStats[] {
  return FORMATS.flatMap((f) => (p.stats[f] ? [p.stats[f]] : []))
}

/**
 * Is the career total of `stat` at least `min`? Null figures count as unknown, so a total that is
 * short of `min` only gives "no" when every played format has a figure. A missing wickets or
 * hundreds figure means the source shows none, so those count as zero.
 */
function atLeast(p: Player, stat: Stat, min: number, format?: Format): boolean | null {
  const list = format ? (p.stats[format] ? [p.stats[format]] : []) : formats(p)
  let total = 0
  let unknown = false
  for (const s of list) {
    const v = s[stat]
    if (v === null) unknown ||= stat === 'runs'
    else total += v
  }
  if (total >= min) return true
  return unknown ? null : false
}

const matchesIn = (p: Player, f: Format) => p.stats[f]?.matches ?? 0

/** Highest score in Tests, ignoring the not-out star. */
function bestTestScore(p: Player): number | null {
  const hs = p.stats.test?.highScore
  if (!p.stats.test) return 0
  return hs ? Number.parseInt(hs, 10) : null
}

/** Most wickets in an innings in any format, from "5/23"-style figures. */
function bestHaul(p: Player): number | null {
  let best = 0
  for (const s of formats(p)) {
    if (s.bestBowling) best = Math.max(best, Number.parseInt(s.bestBowling, 10) || 0)
  }
  return best
}

/** Was the player active in international cricket at some point in [from, to]? */
function playedBetween(p: Player, from: number, to: number): boolean | null {
  if (p.debutYear > to) return false
  if (p.active) return true
  if (p.lastYear === null) return null
  return p.lastYear >= from
}

/** Retired before `year`? Active players haven't retired. */
function retiredBefore(p: Player, year: number): boolean | null {
  if (p.active) return false
  if (p.lastYear === null) return null
  return p.lastYear < year
}

const isSpin = (p: Player) => (SPIN_TYPES as readonly string[]).includes(p.bowlingType)
const isPace = (p: Player) => /fast|medium/.test(p.bowlingType)

const ASIA: readonly Country[] = ['India', 'Pakistan', 'Sri Lanka', 'Bangladesh', 'Afghanistan']
const BIG_FOUR: readonly Country[] = ['England', 'Australia', 'New Zealand', 'South Africa']

const q = (
  id: string,
  text: string,
  difficulty: QuestionDifficulty,
  test: Question['test'],
): Question => ({ id, text, difficulty, test })

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-')

export const QUESTIONS: readonly Question[] = [
  // Role
  q(
    'role-batter',
    'Is your player a specialist batter (not a wicketkeeper)?',
    'easy',
    (p) => p.role === 'Batter',
  ),
  q(
    'role-keeper',
    'Is your player a wicketkeeper?',
    'easy',
    (p) => p.role === 'Wicketkeeper-Batter',
  ),
  q('role-allrounder', 'Is your player an all-rounder?', 'easy', (p) => p.role === 'All-rounder'),
  q('role-bowler', 'Is your player a specialist bowler?', 'easy', (p) => p.role === 'Bowler'),
  q(
    'role-bats-first',
    'Is your player mainly picked for their batting (including keepers)?',
    'easy',
    (p) => p.role === 'Batter' || p.role === 'Wicketkeeper-Batter',
  ),

  // Country and region
  ...COUNTRIES.map((c) =>
    q(`country-${slug(c)}`, `Does your player play for ${c}?`, 'easy', (p) => p.country === c),
  ),
  q(
    'region-asia',
    'Is your player from an Asian team (India, Pakistan, Sri Lanka, Bangladesh or Afghanistan)?',
    'easy',
    (p) => ASIA.includes(p.country),
  ),
  q(
    'region-big-four',
    'Is your player from England, Australia, New Zealand or South Africa?',
    'easy',
    (p) => BIG_FOUR.includes(p.country),
  ),

  // Style
  q('bats-left', 'Does your player bat left-handed?', 'easy', (p) => p.battingHand === 'Left'),
  q('bowls-spin', 'Does your player bowl spin?', 'easy', isSpin),
  q('bowls-pace', 'Does your player bowl pace (fast or medium)?', 'easy', isPace),
  q('bowls-fast', 'Is your player a genuinely fast bowler (not medium pace)?', 'medium', (p) =>
    /fast/.test(p.bowlingType),
  ),
  q('bowls-left-arm', 'Does your player bowl left-arm?', 'medium', (p) =>
    /^Left-arm/.test(p.bowlingType),
  ),
  q('bowls-leg-spin', 'Does your player bowl leg-spin or wrist-spin?', 'medium', (p) =>
    /leg-spin|wrist-spin/.test(p.bowlingType),
  ),
  q(
    'bowls-off-spin',
    'Does your player bowl off-spin?',
    'medium',
    (p) => p.bowlingType === 'Right-arm off-spin',
  ),
  q('bowls-none', 'Does your player hardly ever bowl?', 'medium', (p) => p.bowlingType === 'None'),

  // Career span
  q('active', 'Is your player still playing international cricket?', 'easy', (p) => p.active),
  ...[1980, 1990, 1995, 2000, 2005, 2010, 2015, 2020].map((y) =>
    q(
      `debut-before-${y}`,
      `Did your player make their international debut before ${y}?`,
      'medium',
      (p) => p.debutYear < y,
    ),
  ),
  ...[1990, 2000, 2005, 2010, 2015, 2020].map((y) =>
    q(
      `retired-before-${y}`,
      `Did your player play their last international match before ${y}?`,
      'medium',
      (p) => retiredBefore(p, y),
    ),
  ),
  ...[1970, 1980, 1990, 2000, 2010, 2020].map((d) =>
    q(`decade-${d}s`, `Did your player play international cricket in the ${d}s?`, 'medium', (p) =>
      playedBetween(p, d, d + 9),
    ),
  ),

  // Matches
  ...[100, 200, 300, 400].map((m) =>
    q(
      `intl-${m}`,
      `Has your player played ${m}+ international matches in total?`,
      'hard',
      (p) => p.intlMatches >= m,
    ),
  ),
  q('played-test', 'Has your player played Test cricket?', 'easy', (p) => !!p.stats.test),
  q('played-odi', 'Has your player played ODIs?', 'easy', (p) => !!p.stats.odi),
  q('played-t20i', 'Has your player played T20 internationals?', 'medium', (p) => !!p.stats.t20i),
  q('tests-50', 'Has your player played 50+ Tests?', 'hard', (p) => matchesIn(p, 'test') >= 50),
  q(
    'tests-100',
    'Has your player played 100+ Tests?',
    'medium',
    (p) => matchesIn(p, 'test') >= 100,
  ),
  q('odis-100', 'Has your player played 100+ ODIs?', 'hard', (p) => matchesIn(p, 'odi') >= 100),
  q('odis-200', 'Has your player played 200+ ODIs?', 'hard', (p) => matchesIn(p, 'odi') >= 200),
  q(
    't20is-50',
    'Has your player played 50+ T20 internationals?',
    'hard',
    (p) => matchesIn(p, 't20i') >= 50,
  ),

  // Runs
  ...[1000, 3000, 5000, 10000, 15000].map((r) =>
    q(`runs-${r}`, `Has your player scored ${n(r)}+ international runs?`, 'hard', (p) =>
      atLeast(p, 'runs', r),
    ),
  ),
  ...(['test', 'odi'] as const).flatMap((f) =>
    [5000, 10000].map((r) =>
      q(`runs-${f}-${r}`, `Has your player scored ${n(r)}+ ${FORMAT_LABEL[f]} runs?`, 'hard', (p) =>
        atLeast(p, 'runs', r, f),
      ),
    ),
  ),
  q('test-double', 'Has your player scored a Test double hundred?', 'medium', (p) => {
    const best = bestTestScore(p)
    return best === null ? null : best >= 200
  }),

  // Wickets
  ...[50, 100, 200, 300, 500].map((w) =>
    q(`wickets-${w}`, `Has your player taken ${w}+ international wickets?`, 'hard', (p) =>
      atLeast(p, 'wickets', w),
    ),
  ),
  q('wickets-test-300', 'Has your player taken 300+ Test wickets?', 'hard', (p) =>
    atLeast(p, 'wickets', 300, 'test'),
  ),
  q('wickets-odi-200', 'Has your player taken 200+ ODI wickets?', 'hard', (p) =>
    atLeast(p, 'wickets', 200, 'odi'),
  ),
  q(
    'five-for',
    'Has your player taken five wickets in an international innings?',
    'medium',
    (p) => {
      const best = bestHaul(p)
      return best === null ? null : best >= 5
    },
  ),

  // Hundreds
  q('hundred-any', 'Has your player scored an international hundred?', 'medium', (p) =>
    atLeast(p, 'hundreds', 1),
  ),
  ...[10, 20, 40].map((h) =>
    q(`hundreds-${h}`, `Has your player scored ${h}+ international hundreds?`, 'hard', (p) =>
      atLeast(p, 'hundreds', h),
    ),
  ),
]

export const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(
  QUESTIONS.map((x) => [x.id, x]),
)
