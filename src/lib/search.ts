import { MAX_SEARCH_RESULTS } from '../config'
import type { Player } from '../types'

/** Lowercase, strip accents and punctuation, collapse whitespace. "M.S. Dhoní" -> "ms dhoni". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** True if `query` matches `text` starting at the beginning of any word. */
function matchesWordStart(text: string, query: string): boolean {
  if (text.startsWith(query)) return true
  for (let i = text.indexOf(' '); i !== -1; i = text.indexOf(' ', i + 1)) {
    if (text.startsWith(query, i + 1)) return true
  }
  return false
}

interface Indexed {
  player: Player
  name: string
  aliases: string[]
}

const indexCache = new WeakMap<readonly Player[], Indexed[]>()

function indexPlayers(players: readonly Player[]): Indexed[] {
  let index = indexCache.get(players)
  if (!index) {
    index = players.map((player) => ({
      player,
      name: normalize(player.name),
      aliases: player.aliases.map(normalize),
    }))
    indexCache.set(players, index)
  }
  return index
}

/**
 * Autocomplete: case- and accent-insensitive, matching the start of any word in the name or an
 * alias. Ranking: full-name prefix, then a later word in the name, then an alias; ties broken by
 * how well known the player is, then alphabetically.
 */
export function searchPlayers(
  players: readonly Player[],
  query: string,
  excludeIds: ReadonlySet<string> | readonly string[] = [],
  limit = MAX_SEARCH_RESULTS,
): Player[] {
  const q = normalize(query)
  if (q === '') return []
  const exclude = excludeIds instanceof Set ? excludeIds : new Set(excludeIds)

  const ranked: { player: Player; rank: number }[] = []
  for (const entry of indexPlayers(players)) {
    if (exclude.has(entry.player.id)) continue
    let rank: number
    if (entry.name.startsWith(q)) rank = 0
    else if (matchesWordStart(entry.name, q)) rank = 1
    else if (entry.aliases.some((a) => matchesWordStart(a, q))) rank = 2
    else continue
    ranked.push({ player: entry.player, rank })
  }

  ranked.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.player.difficulty - b.player.difficulty ||
      a.player.name.localeCompare(b.player.name),
  )
  return ranked.slice(0, limit).map((r) => r.player)
}
