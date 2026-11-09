import type { Player } from '../types'

/** Link to the player's English Wikipedia article ("Steve Smith (cricketer)" -> ".../Steve_Smith_(cricketer)"). */
export function wikipediaUrl(player: Pick<Player, 'wikipedia'>): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(player.wikipedia.replaceAll(' ', '_'))}`
}
