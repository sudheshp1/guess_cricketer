/**
 * Merge a seed row with its source snapshots into a Player, recording where each value came
 * from and any disagreement between sources.
 */
import {
  BATTING_HANDS,
  BOWLING_TYPES,
  COUNTRIES,
  ROLES,
  type Country,
  type Difficulty,
  type Player,
} from '../../src/types.ts'
import {
  mapBattingHand,
  mapBowlingType,
  mapRole,
  mapRoleFromText,
  parseInfoboxFields,
  readInfobox,
  spanIsOpen,
  type FormatKey,
} from './infobox.ts'

const FORMATS: FormatKey[] = ['test', 'odi', 't20i']
import type { CricsheetPlayer, SeedRow, WikipediaPage } from './sources.ts'

/** Cricsheet holds every men's international from this year on (Afghanistan matches aside). */
export const CRICSHEET_COMPLETE_FROM = 2006

/** Without an explicit span, a player counts as active if they played within this many days. */
export const ACTIVE_WINDOW_DAYS = 365

export interface Resolution {
  player: Player | null
  /** Hard problems: the player cannot be built until these are fixed. */
  errors: string[]
  /** Source disagreements and caveats worth a human look. */
  notes: string[]
}

const COUNTRY_ALIASES: Record<string, Country> = {
  'west indies cricket team': 'West Indies',
  windies: 'West Indies',
  'united kingdom': 'England',
}

export function mapCountry(raw: string | null): Country | null {
  if (!raw) return null
  const s = raw.trim()
  const exact = COUNTRIES.find((c) => c.toLowerCase() === s.toLowerCase())
  if (exact) return exact
  const alias = COUNTRY_ALIASES[s.toLowerCase()]
  if (alias) return alias
  // "England, Ireland" style: take the last listed (most recent) team that is a known country.
  const parts = s.split(/,|&|\band\b/).map((p) => p.trim())
  for (const part of parts.reverse()) {
    const hit = COUNTRIES.find((c) => c.toLowerCase() === part.toLowerCase())
    if (hit) return hit
  }
  return null
}

function enumOverride<T extends string>(
  value: string,
  allowed: readonly T[],
  field: string,
  errors: string[],
): T | null {
  if (value === '') return null
  if ((allowed as readonly string[]).includes(value)) return value as T
  errors.push(`override ${field}="${value}" is not one of: ${allowed.join(', ')}`)
  return null
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

export function resolvePlayer(
  row: SeedRow,
  wiki: WikipediaPage | undefined,
  cricsheet: CricsheetPlayer | undefined,
  asOf: string,
): Resolution {
  const errors: string[] = []
  const notes: string[] = []
  if (!wiki) {
    return { player: null, errors: ['no Wikipedia snapshot (run npm run data:fetch)'], notes }
  }
  const facts = readInfobox(parseInfoboxFields(wiki.infobox))

  // Category fields: explicit override first, then the mapped infobox value.
  const country =
    enumOverride(row.country, COUNTRIES, 'country', errors) ?? mapCountry(facts.country)
  if (!country) errors.push(`country not recognised from infobox: "${facts.country ?? ''}"`)

  let role = enumOverride(row.role, ROLES, 'role', errors) ?? mapRole(facts.role)
  if (!role && row.role === '' && wiki.lead) {
    role = mapRoleFromText(wiki.lead)
    if (role) notes.push(`infobox has no usable role; "${role}" taken from the article lead`)
  }
  if (!role) errors.push(`role not recognised from infobox: "${facts.role ?? ''}"`)

  const battingHand =
    enumOverride(row.battingHand, BATTING_HANDS, 'battingHand', errors) ??
    mapBattingHand(facts.batting)
  if (!battingHand) errors.push(`batting hand not recognised: "${facts.batting ?? ''}"`)

  const bowlingType =
    enumOverride(row.bowlingType, BOWLING_TYPES, 'bowlingType', errors) ??
    mapBowlingType(facts.bowling)
  if (!bowlingType) errors.push(`bowling type not recognised: "${facts.bowling ?? ''}"`)
  if (row.bowlingType === '' && facts.bowling === null) {
    notes.push('infobox has no bowling style; using None')
  }

  // Debut year: earliest international debut listed in the infobox.
  const wikiDebut = Math.min(...Object.values(facts.debutYears))
  let debutYear: number | null = row.debutYear !== '' ? Number(row.debutYear) : null
  if (debutYear === null) {
    if (Number.isFinite(wikiDebut)) debutYear = wikiDebut
    else errors.push('no debut year in infobox')
  }
  if (cricsheet && Number.isFinite(wikiDebut)) {
    const csFirst = Number(cricsheet.firstDate.slice(0, 4))
    if (csFirst < wikiDebut) {
      notes.push(`Cricsheet has a match in ${csFirst}, before infobox debut ${wikiDebut}`)
    } else if (wikiDebut >= CRICSHEET_COMPLETE_FROM && csFirst !== wikiDebut) {
      notes.push(`debut: infobox ${wikiDebut}, Cricsheet first match ${csFirst}`)
    }
  }

  // International matches, per format: Wikipedia can lag behind or omit a format column (the
  // infobox shows at most four columns); Cricsheet can only miss matches. Use the larger.
  let intlMatches: number | null = row.intlMatches !== '' ? Number(row.intlMatches) : null
  if (intlMatches === null) {
    const csByFormat: Record<FormatKey, number> | null = cricsheet
      ? { test: cricsheet.tests, odi: cricsheet.odis, t20i: cricsheet.t20is }
      : null
    let total = 0
    for (const f of FORMATS) {
      const w = facts.matches[f] ?? wiki.fromLists?.[f]?.matches
      const c = csByFormat?.[f] ?? 0
      const playedFormat = w !== undefined || c > 0 || facts.debutYears[f] !== undefined
      if (!playedFormat) continue
      if (w === undefined && c === 0) {
        errors.push(`${f}: debut listed but no match count in infobox or Cricsheet`)
        continue
      }
      if (w === undefined) {
        notes.push(`${f}: not in infobox or list page; using Cricsheet count ${c}`)
      } else if (c > w) {
        notes.push(
          `${f}: Cricsheet ${c} > infobox ${w} (infobox stats dated ${facts.statsDate ?? 'unknown'}); using Cricsheet`,
        )
      } else if (w - c >= 10 && cricsheet && wikiDebut >= CRICSHEET_COMPLETE_FROM) {
        notes.push(`${f}: infobox ${w} vs Cricsheet ${c} (large Cricsheet gap)`)
      }
      total += Math.max(w ?? 0, c)
    }
    if (total === 0) errors.push('no international match counts found')
    else intlMatches = total
  }

  // Active: explicit override, else open-ended international span, else recent match.
  let active: boolean | null = null
  if (row.active !== '') {
    if (row.active === 'true' || row.active === 'false') active = row.active === 'true'
    else errors.push(`override active="${row.active}" must be true or false`)
  }
  if (active === null) {
    const open = spanIsOpen(facts.internationalSpan)
    if (open !== null) {
      active = open
      if (!open && cricsheet && daysBetween(cricsheet.lastDate, asOf) < 180) {
        notes.push(
          `span "${facts.internationalSpan}" is closed but played on ${cricsheet.lastDate}`,
        )
      }
    } else if (cricsheet) {
      active = daysBetween(cricsheet.lastDate, asOf) <= ACTIVE_WINDOW_DAYS
      notes.push(`no international span; active=${active} from last match ${cricsheet.lastDate}`)
    } else {
      const lastYear = Math.max(...Object.values(facts.lastYears))
      const asOfYear = Number(asOf.slice(0, 4))
      if (Number.isFinite(lastYear) && asOfYear - lastYear >= 2) {
        active = false
        notes.push(`no international span; retired (last international ${lastYear} per infobox)`)
      } else {
        errors.push('cannot determine active status')
      }
    }
  }

  if (!cricsheet) notes.push('no Cricsheet record; values from Wikipedia only')
  if (row.todo_verify) notes.push(`TODO_VERIFY: ${row.todo_verify}`)

  const difficulty = Number(row.difficulty)
  if (![1, 2, 3].includes(difficulty)) errors.push(`difficulty "${row.difficulty}" must be 1-3`)

  if (
    errors.length > 0 ||
    !country ||
    !role ||
    !battingHand ||
    !bowlingType ||
    debutYear === null ||
    intlMatches === null ||
    active === null
  ) {
    return { player: null, errors, notes }
  }

  return {
    player: {
      id: row.id,
      name: row.name,
      aliases: row.aliases
        .split('|')
        .map((a) => a.trim())
        .filter(Boolean),
      country,
      role,
      battingHand,
      bowlingType,
      debutYear,
      intlMatches,
      active,
      difficulty: difficulty as Difficulty,
    },
    errors,
    notes,
  }
}
