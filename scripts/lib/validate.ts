import { BATTING_HANDS, BOWLING_TYPES, COUNTRIES, FORMATS, ROLES } from '../../src/types.ts'

const REQUIRED = [
  'id',
  'name',
  'aliases',
  'country',
  'role',
  'battingHand',
  'bowlingType',
  'debutYear',
  'intlMatches',
  'active',
  'difficulty',
  'wikipedia',
] as const

/** Returns a list of problems; empty means the data is valid. */
export function validatePlayers(data: unknown, currentYear = new Date().getFullYear()): string[] {
  const errors: string[] = []
  if (!Array.isArray(data)) return ['players.json must be an array']

  const seen = new Set<string>()
  data.forEach((raw: unknown, index) => {
    if (typeof raw !== 'object' || raw === null) {
      errors.push(`[${index}] is not an object`)
      return
    }
    const p = raw as Record<string, unknown>
    const label = typeof p.id === 'string' ? p.id : `[${index}]`

    for (const field of REQUIRED) {
      if (p[field] === undefined || p[field] === null || p[field] === '') {
        errors.push(`${label}: missing ${field}`)
      }
    }
    if (typeof p.id === 'string') {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id)) errors.push(`${label}: id must be kebab-case`)
      if (seen.has(p.id)) errors.push(`${label}: duplicate id`)
      seen.add(p.id)
    }
    if (p.name !== undefined && typeof p.name !== 'string')
      errors.push(`${label}: name must be a string`)
    if (!Array.isArray(p.aliases) || !p.aliases.every((a) => typeof a === 'string')) {
      errors.push(`${label}: aliases must be an array of strings`)
    }
    const inEnum = (field: string, allowed: readonly string[]) => {
      if (p[field] !== undefined && !allowed.includes(p[field] as string)) {
        errors.push(`${label}: ${field} "${String(p[field])}" is not allowed`)
      }
    }
    inEnum('country', COUNTRIES)
    inEnum('role', ROLES)
    inEnum('battingHand', BATTING_HANDS)
    inEnum('bowlingType', BOWLING_TYPES)

    if (p.debutYear !== undefined) {
      if (!Number.isInteger(p.debutYear)) errors.push(`${label}: debutYear must be an integer`)
      else if ((p.debutYear as number) < 1877 || (p.debutYear as number) > currentYear) {
        errors.push(`${label}: debutYear ${String(p.debutYear)} outside 1877-${currentYear}`)
      }
    }
    if (p.intlMatches !== undefined) {
      if (!Number.isInteger(p.intlMatches)) errors.push(`${label}: intlMatches must be an integer`)
      else if ((p.intlMatches as number) < 0) errors.push(`${label}: intlMatches is negative`)
    }
    if (p.active !== undefined && typeof p.active !== 'boolean') {
      errors.push(`${label}: active must be a boolean`)
    }
    if (p.difficulty !== undefined && ![1, 2, 3].includes(p.difficulty as number)) {
      errors.push(`${label}: difficulty must be 1, 2 or 3`)
    }
    if (p.lastYear !== null && p.lastYear !== undefined && !Number.isInteger(p.lastYear)) {
      errors.push(`${label}: lastYear must be an integer or null`)
    }
    if (p.wikipedia !== undefined && typeof p.wikipedia !== 'string') {
      errors.push(`${label}: wikipedia must be a string`)
    }
    if (p.statsAsOf !== null && p.statsAsOf !== undefined && typeof p.statsAsOf !== 'string') {
      errors.push(`${label}: statsAsOf must be a string or null`)
    }
    if (typeof p.stats !== 'object' || p.stats === null || Array.isArray(p.stats)) {
      errors.push(`${label}: stats must be an object`)
    } else {
      for (const [format, raw] of Object.entries(p.stats as Record<string, unknown>)) {
        if (!(FORMATS as readonly string[]).includes(format)) {
          errors.push(`${label}: stats has unknown format "${format}"`)
          continue
        }
        const s = raw as Record<string, unknown>
        if (!Number.isInteger(s.matches) || (s.matches as number) <= 0) {
          errors.push(`${label}: stats.${format}.matches must be a positive integer`)
        }
        for (const k of ['runs', 'hundreds', 'fifties', 'wickets'] as const) {
          const v = s[k]
          if (v !== null && (!Number.isInteger(v) || (v as number) < 0)) {
            errors.push(`${label}: stats.${format}.${k} must be a non-negative integer or null`)
          }
        }
        if (s.highScore !== null && !/^\d+\*?$/.test(String(s.highScore))) {
          errors.push(`${label}: stats.${format}.highScore "${String(s.highScore)}" is malformed`)
        }
        if (s.bestBowling !== null && !/^\d+\/\d+$/.test(String(s.bestBowling))) {
          errors.push(
            `${label}: stats.${format}.bestBowling "${String(s.bestBowling)}" is malformed`,
          )
        }
      }
    }
  })
  return errors
}
