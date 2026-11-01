/**
 * Network step: snapshot source data for every player in players-seed.csv.
 *
 *   npm run data:fetch            # Wikipedia + Cricsheet
 *   npm run data:fetch -- --wiki  # Wikipedia only
 *   npm run data:fetch -- --cricsheet
 *
 * Writes scripts/sources/wikipedia.json and scripts/sources/cricsheet.json, which are committed so
 * `npm run data` is reproducible offline. Cricsheet zips are cached in scripts/.cache/.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { unzipSync } from 'fflate'
import {
  extractInfobox,
  findCricinfoId,
  findListRowMatches,
  parseInfoboxFields,
  readInfobox,
} from './lib/infobox.ts'
import {
  CACHE_DIR,
  CRICSHEET_PATH,
  SOURCES_DIR,
  WIKIPEDIA_PATH,
  readJson,
  readSeed,
  type CricsheetPlayer,
  type CricsheetSnapshot,
  type WikipediaPage,
  type WikipediaSnapshot,
} from './lib/sources.ts'

const USER_AGENT = 'CricdleDataBuilder/1.0 (https://github.com/sudheshp1/guess_cricketer)'
const today = new Date().toISOString().slice(0, 10)

async function fetchWikipedia(): Promise<void> {
  const seed = readSeed()
  const previous: WikipediaSnapshot | null = existsSync(WIKIPEDIA_PATH)
    ? readJson<WikipediaSnapshot>(WIKIPEDIA_PATH)
    : null
  const refresh = process.argv.includes('--refresh')
  const pages: Record<string, WikipediaPage> = refresh ? {} : { ...(previous?.pages ?? {}) }

  // Re-fetch rows that are new or whose Wikipedia title changed.
  const todo = seed.filter((row) => pages[row.id]?.requested !== row.wikipedia)
  console.log(`Wikipedia: ${todo.length} page(s) to fetch, ${seed.length - todo.length} cached`)

  const failures: string[] = []
  for (let i = 0; i < todo.length; i += 50) {
    const batch = todo.slice(i, i + 50)
    const url = new URL('https://en.wikipedia.org/w/api.php')
    url.search = new URLSearchParams({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content|ids',
      rvslots: 'main',
      format: 'json',
      formatversion: '2',
      redirects: '1',
      titles: batch.map((r) => r.wikipedia).join('|'),
    }).toString()
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`)
    const data = (await res.json()) as WikiResponse

    // Map requested title -> final title through normalisation and redirects.
    const resolve = (title: string): string => {
      let t = title
      for (const n of data.query.normalized ?? []) if (n.from === t) t = n.to
      for (const r of data.query.redirects ?? []) if (r.from === t) t = r.to
      return t
    }
    const byTitle = new Map(data.query.pages.map((p) => [p.title, p]))

    for (const row of batch) {
      const page = byTitle.get(resolve(row.wikipedia))
      const rev = page?.revisions?.[0]
      const content = rev?.slots.main.content
      const infobox = content ? extractInfobox(content) : null
      if (!page || !rev || !content || !infobox) {
        failures.push(`${row.id} (${row.wikipedia})`)
        continue
      }
      pages[row.id] = {
        requested: row.wikipedia,
        title: page.title,
        revid: rev.revid,
        infobox,
        cricinfoId: findCricinfoId(content),
      }
    }
    await new Promise((r) => setTimeout(r, 500))
  }

  await fillT20iFromLists(pages, refresh ? null : new Set(todo.map((r) => r.id)))

  // Drop pages for players no longer in the seed.
  const ids = new Set(seed.map((r) => r.id))
  for (const id of Object.keys(pages)) if (!ids.has(id)) delete pages[id]

  const sorted = Object.fromEntries(Object.entries(pages).sort(([a], [b]) => a.localeCompare(b)))
  const fetchedAt = todo.length > 0 || !previous ? today : previous.fetchedAt
  writeFileSync(WIKIPEDIA_PATH, JSON.stringify({ fetchedAt, pages: sorted }, null, 1) + '\n')
  if (failures.length > 0) {
    console.error(`No cricketer infobox found for:\n  ${failures.join('\n  ')}`)
    process.exitCode = 1
  }
}

async function fetchPage(
  title: string,
): Promise<{ title: string; revid: number; content: string }> {
  const url = new URL('https://en.wikipedia.org/w/api.php')
  url.search = new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content|ids',
    rvslots: 'main',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    titles: title,
  }).toString()
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`)
  const data = (await res.json()) as WikiResponse
  const page = data.query.pages[0]
  const rev = page?.revisions?.[0]
  if (!page || !rev) throw new Error(`Wikipedia page not found: ${title}`)
  return { title: page.title, revid: rev.revid, content: rev.slots.main.content }
}

/**
 * For players whose infobox lacks a T20I column, read their T20I match count from the
 * country's list page. `onlyIds` limits this to freshly fetched players (null = all).
 */
async function fillT20iFromLists(
  pages: Record<string, WikipediaPage>,
  onlyIds: Set<string> | null,
): Promise<void> {
  const byCountry = new Map<string, string[]>()
  for (const [id, page] of Object.entries(pages)) {
    if (onlyIds && !onlyIds.has(id)) continue
    const facts = readInfobox(parseInfoboxFields(page.infobox))
    if (facts.matches.t20i !== undefined || facts.debutYears.t20i === undefined) continue
    const country = facts.country ?? ''
    byCountry.set(country, [...(byCountry.get(country) ?? []), id])
  }
  for (const [country, ids] of byCountry) {
    const listTitle = `List of ${country} Twenty20 International cricketers`
    const list = await fetchPage(listTitle)
    for (const id of ids) {
      const page = pages[id]!
      const matches = page.cricinfoId ? findListRowMatches(list.content, page.cricinfoId) : null
      if (matches === null) {
        console.warn(`  ${id}: not found in "${listTitle}"`)
        continue
      }
      page.t20iFromList = { page: list.title, revid: list.revid, matches }
    }
    await new Promise((r) => setTimeout(r, 300))
  }
}

interface WikiResponse {
  query: {
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
    pages: {
      title: string
      missing?: boolean
      revisions?: { revid: number; slots: { main: { content: string } } }[]
    }[]
  }
}

const CRICSHEET_ARCHIVES = {
  tests: 'tests_male_json.zip',
  odis: 'odis_male_json.zip',
  t20is: 't20s_male_json.zip',
} as const

async function download(name: string): Promise<Uint8Array> {
  mkdirSync(CACHE_DIR, { recursive: true })
  const path = join(CACHE_DIR, name)
  if (!existsSync(path) || process.argv.includes('--refresh')) {
    console.log(`Downloading ${name}...`)
    const res = await fetch(`https://cricsheet.org/downloads/${name}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) throw new Error(`Cricsheet HTTP ${res.status} for ${name}`)
    writeFileSync(path, new Uint8Array(await res.arrayBuffer()))
  }
  return new Uint8Array(readFileSync(path))
}

async function fetchCricsheet(): Promise<void> {
  const seed = readSeed()
  if (!existsSync(WIKIPEDIA_PATH)) throw new Error('Run the Wikipedia fetch first')
  const wiki = readJson<WikipediaSnapshot>(WIKIPEDIA_PATH)

  // Cricsheet register: map ESPNcricinfo ids -> Cricsheet person identifiers.
  mkdirSync(CACHE_DIR, { recursive: true })
  const registerPath = join(CACHE_DIR, 'people.csv')
  if (!existsSync(registerPath) || process.argv.includes('--refresh')) {
    const res = await fetch('https://cricsheet.org/register/people.csv', {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) throw new Error(`Cricsheet register HTTP ${res.status}`)
    writeFileSync(registerPath, await res.text())
  }
  const cricinfoToCricsheet = new Map<string, string>()
  const lines = readFileSync(registerPath, 'utf8').split(/\r?\n/)
  const header = lines[0]!.split(',')
  const idCol = header.indexOf('identifier')
  const ciCols = ['key_cricinfo', 'key_cricinfo_2', 'key_cricinfo_3'].map((c) => header.indexOf(c))
  for (const line of lines.slice(1)) {
    // The register has no quoted commas in the columns we read.
    const cells = line.split(',')
    for (const c of ciCols) {
      const ci = cells[c]
      if (ci) cricinfoToCricsheet.set(ci, cells[idCol]!)
    }
  }

  const wanted = new Map<string, string>() // cricsheet id -> seed id
  for (const row of seed) {
    const ci = wiki.pages[row.id]?.cricinfoId
    const cs = ci ? cricinfoToCricsheet.get(ci) : undefined
    if (cs) wanted.set(cs, row.id)
  }
  console.log(`Cricsheet: ${wanted.size}/${seed.length} seed players matched via ESPNcricinfo id`)

  const stats = new Map<string, CricsheetPlayer>()
  let latestMatch = ''
  for (const [format, archive] of Object.entries(CRICSHEET_ARCHIVES) as [
    keyof typeof CRICSHEET_ARCHIVES,
    string,
  ][]) {
    const files = unzipSync(await download(archive), { filter: (f) => f.name.endsWith('.json') })
    for (const bytes of Object.values(files)) {
      const match = JSON.parse(new TextDecoder().decode(bytes)) as CricsheetMatch
      const info = match.info
      if (info.team_type !== 'international') continue
      const date = info.dates[0]!
      if (date > latestMatch) latestMatch = date
      for (const [team, names] of Object.entries(info.players)) {
        for (const name of names) {
          const csId = info.registry.people[name]
          if (!csId || !wanted.has(csId)) continue
          const s = stats.get(csId) ?? {
            cricsheetId: csId,
            tests: 0,
            odis: 0,
            t20is: 0,
            firstDate: date,
            lastDate: date,
            teams: [],
          }
          s[format]++
          if (date < s.firstDate) s.firstDate = date
          if (date > s.lastDate) s.lastDate = date
          if (!s.teams.includes(team)) s.teams.push(team)
          stats.set(csId, s)
        }
      }
    }
  }

  const players: Record<string, CricsheetPlayer> = {}
  for (const [csId, seedId] of [...wanted].sort(([, a], [, b]) => a.localeCompare(b))) {
    const s = stats.get(csId)
    if (s) players[seedId] = { ...s, teams: s.teams.sort() }
  }
  const snapshot: CricsheetSnapshot = { fetchedAt: today, latestMatch, players }
  writeFileSync(CRICSHEET_PATH, JSON.stringify(snapshot, null, 1) + '\n')
  console.log(
    `Cricsheet: stats for ${Object.keys(players).length} players (latest match ${latestMatch})`,
  )
}

interface CricsheetMatch {
  info: {
    team_type: string
    dates: string[]
    players: Record<string, string[]>
    registry: { people: Record<string, string> }
  }
}

mkdirSync(SOURCES_DIR, { recursive: true })
const onlyWiki = process.argv.includes('--wiki')
const onlyCricsheet = process.argv.includes('--cricsheet')
if (!onlyCricsheet) await fetchWikipedia()
if (!onlyWiki) await fetchCricsheet()
