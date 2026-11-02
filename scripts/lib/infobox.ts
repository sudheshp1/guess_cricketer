/**
 * Parsing helpers for Wikipedia's {{Infobox cricketer}} template, plus mappers from
 * free-text infobox values to the game's enums.
 */
import type { BattingHand, BowlingType, Role } from '../../src/types.ts'

/** Extract the raw `{{Infobox cricketer ...}}` block from a page's wikitext. */
export function extractInfobox(wikitext: string): string | null {
  const start = wikitext.search(/\{\{\s*Infobox cricketer/i)
  if (start < 0) return null
  let depth = 0
  for (let i = start; i < wikitext.length - 1; i++) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      depth++
      i++
    } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      depth--
      i++
      if (depth === 0) return wikitext.slice(start, i + 1)
    }
  }
  return null
}

/** Split an infobox into `field -> raw value`, respecting nested templates and links. */
export function parseInfoboxFields(infobox: string): Record<string, string> {
  const body = infobox.replace(/^\{\{\s*Infobox cricketer/i, '').replace(/\}\}$/, '')
  const parts: string[] = []
  let depthCurly = 0
  let depthSquare = 0
  let current = ''
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2)
    if (two === '{{') {
      depthCurly++
      current += two
      i++
      continue
    }
    if (two === '}}') {
      depthCurly--
      current += two
      i++
      continue
    }
    if (two === '[[') {
      depthSquare++
      current += two
      i++
      continue
    }
    if (two === ']]') {
      depthSquare--
      current += two
      i++
      continue
    }
    if (body[i] === '|' && depthCurly === 0 && depthSquare === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += body[i]
  }
  parts.push(current)

  const fields: Record<string, string> = {}
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq).trim().toLowerCase()
    const value = part.slice(eq + 1).trim()
    if (key) fields[key] = value
  }
  return fields
}

const LIST_TEMPLATES =
  /^(?:ubl|unbulleted list|hlist|plainlist|plain list|flatlist|flat list|bulleted list|ublist)$/i

/** Turn {{ubl|a|b}}-style list templates into "a, b", respecting [[link|text]] pipes. */
function unwrapListTemplates(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    if (text.startsWith('{{', i)) {
      // Find the matching close braces.
      let depth = 0
      let j = i
      for (; j < text.length - 1; j++) {
        if (text.startsWith('{{', j)) {
          depth++
          j++
        } else if (text.startsWith('}}', j)) {
          depth--
          j++
          if (depth === 0) break
        }
      }
      const inner = text.slice(i + 2, j - 1)
      const args = splitTopLevel(inner)
      const name = (args[0] ?? '').trim()
      if (LIST_TEMPLATES.test(name)) {
        const items = args
          .slice(1)
          .map((a) => a.trim())
          .filter((a) => a !== '' && !/^\w+\s*=/.test(a))
          .map((a) => a.replace(/^\*\s*/gm, '').trim())
        out += items.join(', ')
      } else {
        out += text.slice(i, j + 1)
      }
      i = j + 1
    } else {
      out += text[i]
      i++
    }
  }
  return out
}

/** Split on "|" that are not inside [[...]] or {{...}}. Also splits "*" bullet lines. */
function splitTopLevel(inner: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < inner.length; i++) {
    const two = inner.slice(i, i + 2)
    if (two === '[[' || two === '{{') {
      depth++
      current += two
      i++
    } else if (two === ']]' || two === '}}') {
      depth--
      current += two
      i++
    } else if (inner[i] === '|' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += inner[i]
    }
  }
  parts.push(current)
  // {{plainlist|\n* a\n* b}} puts every item in one argument.
  return parts.flatMap((p, idx) =>
    idx > 0 && /^\s*\*/m.test(p) ? p.split(/\n\s*\*/).map((x) => x.replace(/^\s*\*/, '')) : [p],
  )
}

/** Reduce wikitext markup to plain text: links, refs, comments, simple templates, HTML. */
export function stripMarkup(value: string): string {
  let s = value
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<ref[^>]*\/>/gi, '')
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
  s = s.replace(/<br\s*\/?>/gi, ', ')
  s = s.replace(/<[^>]+>/g, '')
  s = unwrapListTemplates(s)
  // Wrapper templates keep their text; anything else ({{sfn|...}}, {{efn|...}}) is dropped.
  for (let guard = 0; guard < 5 && /\{\{/.test(s); guard++) {
    s = s.replace(/\{\{\s*(?:nowrap|nobr|small)\s*\|([^{}]*)\}\}/gi, '$1')
    s = s.replace(/\{\{[^{}]*\}\}/g, '')
  }
  s = s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
  s = s.replace(/'{2,}/g, '')
  s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/\s+/g, ' ')
  return s.trim()
}

/** Parse an integer that may contain commas or markup; null if absent. */
export function parseCount(value: string | undefined): number | null {
  if (!value) return null
  const m = stripMarkup(value).replace(/,/g, '').match(/\d+/)
  return m ? Number(m[0]) : null
}

export function parseYear(value: string | undefined): number | null {
  if (!value) return null
  const m = stripMarkup(value).match(/\b(1[89]\d{2}|20\d{2})\b/)
  return m ? Number(m[1]) : null
}

export type FormatKey = 'test' | 'odi' | 't20i'

/** Map an infobox `columnN` label to an international format, if it is one. */
export function columnFormat(label: string): FormatKey | null {
  const text = stripMarkup(label).toLowerCase().replace(/\s+/g, '')
  if (text === 'test' || text === 'tests') return 'test'
  if (text === 'odi' || text === 'odis') return 'odi'
  if (text === 't20i' || text === 't20is') return 't20i'
  return null
}

export interface InfoboxFacts {
  name: string | null
  country: string | null
  batting: string | null
  bowling: string | null
  role: string | null
  internationalSpan: string | null
  debutYears: Partial<Record<FormatKey, number>>
  lastYears: Partial<Record<FormatKey, number>>
  matches: Partial<Record<FormatKey, number>>
  career: Partial<Record<FormatKey, InfoboxCareer>>
  statsDate: string | null
}

/** Career figures for one format as printed in the infobox; null where shown as a dash. */
export interface InfoboxCareer {
  runs: number | null
  highScore: string | null
  hundreds: number | null
  fifties: number | null
  wickets: number | null
  bestBowling: string | null
}

/** "254*" -> "254*"; anything else (dashes, blanks) -> null. */
export function parseHighScore(value: string | undefined): string | null {
  if (!value) return null
  const s = stripMarkup(value).replace(/\s/g, '')
  return /^\d+\*?$/.test(s) ? s : null
}

/** "5/23" -> "5/23"; dashes -> null. */
export function parseBestBowling(value: string | undefined): string | null {
  if (!value) return null
  const s = stripMarkup(value).replace(/\s/g, '')
  return /^\d+\/\d+$/.test(s) ? s : null
}

/** "30/31" -> [30, 31]; dashes count as null. */
export function parseHundredsFifties(value: string | undefined): [number | null, number | null] {
  if (!value) return [null, null]
  const parts = stripMarkup(value).split('/')
  const n = (s: string | undefined) => (s && /^\s*\d+\s*$/.test(s) ? Number(s) : null)
  return [n(parts[0]), n(parts[1])]
}

/** Pull the facts the game needs out of a parsed infobox. */
export function readInfobox(fields: Record<string, string>): InfoboxFacts {
  const get = (k: string): string | undefined => fields[k.toLowerCase()]
  const text = (k: string): string | null => {
    const v = get(k)
    if (v === undefined) return null
    const s = stripMarkup(v)
    return s === '' ? null : s
  }

  const debutYears: InfoboxFacts['debutYears'] = {}
  const lastYears: InfoboxFacts['lastYears'] = {}
  const prefixes: Record<FormatKey, string> = { test: 'test', odi: 'odi', t20i: 't20i' }
  for (const [fmt, p] of Object.entries(prefixes) as [FormatKey, string][]) {
    const debut = parseYear(get(`${p}debutyear`)) ?? parseYear(get(`${p}debutdate`))
    if (debut !== null) debutYears[fmt] = debut
    const last = parseYear(get(`last${p}year`)) ?? parseYear(get(`last${p}date`))
    if (last !== null) lastYears[fmt] = last
  }

  const matches: InfoboxFacts['matches'] = {}
  const career: InfoboxFacts['career'] = {}
  for (let n = 1; n <= 6; n++) {
    const label = get(`column${n}`)
    if (!label) continue
    const fmt = columnFormat(label)
    if (!fmt) continue
    const count = parseCount(get(`matches${n}`))
    if (count !== null) matches[fmt] = count
    const [hundreds, fifties] = parseHundredsFifties(get(`100s/50s${n}`))
    career[fmt] = {
      runs: parseCount(get(`runs${n}`)),
      highScore: parseHighScore(get(`top score${n}`)),
      hundreds,
      fifties,
      wickets: parseCount(get(`wickets${n}`)),
      bestBowling: parseBestBowling(get(`best bowling${n}`)),
    }
  }

  // "date = 4 February" with "year = 2006" in a separate field.
  let statsDate = text('date')
  const statsYear = text('year')
  if (statsDate && statsYear && !/\d{4}/.test(statsDate)) statsDate = `${statsDate} ${statsYear}`

  return {
    name: text('name'),
    country: text('country'),
    batting: text('batting'),
    bowling: text('bowling'),
    role: text('role'),
    internationalSpan: text('internationalspan'),
    debutYears,
    lastYears,
    matches,
    career,
    statsDate,
  }
}

/** "Right-handed" -> "Right". */
export function mapBattingHand(batting: string | null): BattingHand | null {
  if (!batting) return null
  const s = batting.toLowerCase()
  if (s.startsWith('right')) return 'Right'
  if (s.startsWith('left')) return 'Left'
  return null
}

/**
 * Map an infobox bowling style to the game's enum. Only the first listed style counts.
 * Pace speed is decided by the first speed word: "fast-medium" -> fast, "medium-fast" -> medium.
 */
export function mapBowlingType(bowling: string | null): BowlingType | null {
  if (bowling === null) return 'None'
  const first =
    bowling
      .split(/,|;|\/|\band\b|\bor\b/i)[0]
      ?.trim()
      .toLowerCase() ?? ''
  if (first === '' || first === '–' || first === '-' || first === 'none' || first === 'n/a') {
    return 'None'
  }
  const s = first.replace(/[‐-―]/g, '-')
  if (/off[ -]?(break|spin)/.test(s)) return 'Right-arm off-spin'
  if (/leg[ -]?(break|spin)|googly/.test(s)) return 'Right-arm leg-spin'
  if (/unorthodox|chinaman|wrist/.test(s) && s.includes('left')) return 'Left-arm wrist-spin'
  if (/orthodox|slow left[ -]arm/.test(s)) return 'Left-arm orthodox'

  // "Slow left-arm" (no orthodox/wrist qualifier) is finger spin; "slow seam"/"slow medium" is pace.
  if (/\bslow\b/.test(s) && !/seam|medium/.test(s)) {
    return s.includes('left') ? 'Left-arm orthodox' : 'Right-arm off-spin'
  }
  const arm = s.includes('left') ? 'Left' : s.includes('right') ? 'Right' : null
  const speed = s.match(/\b(fast|medium)\b/)?.[1] ?? (/\bslow\b/.test(s) ? 'medium' : undefined)
  if (!arm || !speed) return null
  return `${arm}-arm ${speed}` as BowlingType
}

/** Map an infobox role description to the game's four roles. */
export function mapRole(role: string | null): Role | null {
  if (!role) return null
  // "Batsman, occasional wicket-keeper" is a batter: drop occasional / part-time duties first.
  const s = role.toLowerCase().replace(/\b(?:occasional|part[ -]time)\b[^,;/]*/g, '')
  if (/wicket[ -]?keeper|keeper/.test(s)) return 'Wicketkeeper-Batter'
  if (/all[ -]?rounder/.test(s)) return 'All-rounder'
  if (/bowler/.test(s)) return 'Bowler'
  if (/bat(ter|sman|ting)/.test(s)) return 'Batter'
  return null
}

/** True when the international span is open-ended ("2008–present"). */
export function spanIsOpen(span: string | null): boolean | null {
  if (!span) return null
  return /present/i.test(span)
}

/** Find the player's ESPNcricinfo id: infobox source first, then the {{Cricinfo}} template. */
export function findCricinfoId(wikitext: string): string | null {
  const profile =
    /cricinfo\.com\/(?:[a-z0-9-]+\/)*?(?:cricketers\/[a-z0-9-]+-|content\/player\/|player\/)(\d+)/i
  const infobox = extractInfobox(wikitext)
  const source = infobox ? parseInfoboxFields(infobox)['source'] : undefined
  const fromSource = source?.match(profile)?.[1]
  if (fromSource) return fromSource
  const template = wikitext.match(/\{\{\s*(?:espn)?cricinfo\s*\|\s*(?:id\s*=\s*)?(\d+)/i)?.[1]
  if (template) return template
  return wikitext.match(profile)?.[1] ?? null
}

/** Split a wikitable row into plain-text cells (handles `||` and one-cell-per-line styles). */
export function tableRowCells(row: string): string[] {
  const cleaned = row
    .replace(/<span[^>]*display:\s*none[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/\{\{\s*sort\s*\|[^|{}]*\|([^{}]*)\}\}/gi, '$1')
    .replace(/\{\{\s*nts\s*\|([^{}]*)\}\}/gi, '$1')
  // Cell separators: "||", "!!", or a newline followed by "|" or "!".
  return cleaned.split(/\n\s*(?:\|\||!!|\||!)|\|\||!!/).map((cell) => {
    // Drop cell attributes such as `scope="row" |` or `align=left|`.
    const attr = cell.match(/^[^[{|]*=[^[{|]*\|(?!\|)([\s\S]*)$/)
    return stripMarkup(attr ? attr[1]! : cell)
  })
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * In a "List of <country> ... cricketers" table, find the player's row and return its match
 * count (the cell after the first/last year columns). A row is the player's if its reference
 * links to their ESPNcricinfo id, or if it links to their Wikipedia article.
 */
export function findListRowMatches(
  wikitext: string,
  player: { cricinfoId?: string | null; title?: string },
): number | null {
  const idPattern = player.cricinfoId
    ? new RegExp(String.raw`(?:player/|-)${player.cricinfoId}(?:\.html|\b)`)
    : null
  const titlePattern = player.title
    ? new RegExp(String.raw`\[\[\s*${escapeRegExp(player.title).replace(/ /g, '[ _]')}\s*[|\]]`)
    : null
  const isYear = (c: string | undefined) => !!c && /^(1[89]\d{2}|20\d{2})$/.test(c)
  // {{sortname|First|Last}} links to "First Last"; {{sortname|First|Last|Article}} to Article.
  const sortnameLinks = (row: string): string[] =>
    [...row.matchAll(/\{\{\s*sortname\s*\|([^|{}]*)\|([^|{}]*)(?:\|([^|{}]*))?[^{}]*\}\}/gi)].map(
      (m) => (m[3]?.trim() || `${m[1]!.trim()} ${m[2]!.trim()}`).trim(),
    )
  for (const row of wikitext.split(/\n\|-/)) {
    const byId = idPattern?.test(row) ?? false
    const byTitle =
      (titlePattern?.test(row) ?? false) ||
      (!!player.title && sortnameLinks(row).includes(player.title))
    if (!byId && !byTitle) continue
    const cells = tableRowCells(row)
    for (let i = 0; i + 2 < cells.length; i++) {
      const last = cells[i + 1]
      if (isYear(cells[i]) && (isYear(last) || /^present$/i.test(last ?? ''))) {
        const count = cells[i + 2]?.replace(/,/g, '')
        if (count && /^\d+$/.test(count)) return Number(count)
      }
    }
  }
  return null
}

/** Plain text of the article's opening paragraph (after the infobox), for fallbacks. */
export function extractLead(wikitext: string): string {
  const box = extractInfobox(wikitext)
  let rest = box ? wikitext.slice(wikitext.indexOf(box) + box.length) : wikitext
  // Drop templates and files that sit between the infobox and the first sentence.
  for (let guard = 0; guard < 5; guard++) rest = rest.replace(/\{\{[^{}]*\}\}/g, '')
  rest = rest.replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, '')
  const para = rest
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => /'{3}/.test(p) || p.length > 80)
  return para ? stripMarkup(para).slice(0, 600) : ''
}

/**
 * Role from free text such as an article lead: the earliest role phrase wins, so "an opening
 * batsman and occasional bowler" is a Batter.
 */
export function mapRoleFromText(text: string): Role | null {
  const s = text.toLowerCase()
  const patterns: [RegExp, Role][] = [
    [/wicket[ -]?keeper/, 'Wicketkeeper-Batter'],
    [/all[ -]?rounder/, 'All-rounder'],
    [/\b(?:bowler|spinner|seamer|paceman)\b/, 'Bowler'],
    [/\b(?:batter|batsman|batsmen|opener)\b/, 'Batter'],
  ]
  let best: { index: number; role: Role } | null = null
  for (const [re, role] of patterns) {
    const m = re.exec(s)
    if (m && (!best || m.index < best.index)) best = { index: m.index, role }
  }
  return best?.role ?? null
}
