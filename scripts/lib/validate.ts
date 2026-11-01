import { BATTING_HANDS, BOWLING_TYPES, COUNTRIES, ROLES } from '../../src/types.ts'

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
  })
  return errors
}

/** Every schedule entry must be a known player eligible to be an answer (difficulty 1-2). */
export function validateSchedule(
  schedule: unknown,
  players: { id: string; difficulty: number }[],
  minRepeatGap: number,
): string[] {
  const errors: string[] = []
  if (!Array.isArray(schedule) || schedule.length === 0)
    return ['schedule must be a non-empty array']
  const byId = new Map(players.map((p) => [p.id, p]))
  schedule.forEach((id: unknown, day) => {
    const p = typeof id === 'string' ? byId.get(id) : undefined
    if (!p) errors.push(`day ${day}: unknown player "${String(id)}"`)
    else if (p.difficulty > 2) errors.push(`day ${day}: "${p.id}" has difficulty ${p.difficulty}`)
  })
  // The app cycles through the schedule, so check gaps across the wrap-around too.
  const n = schedule.length
  const gap = Math.min(minRepeatGap, n)
  for (let day = 0; day < n; day++) {
    for (let k = 1; k < gap; k++) {
      if (schedule[(day + k) % n] === schedule[day]) {
        errors.push(`"${String(schedule[day])}" repeats within ${gap} days (day ${day})`)
        break
      }
    }
  }
  return errors
}
