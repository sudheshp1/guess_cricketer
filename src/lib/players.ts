import playersJson from '../data/players.json'
import type { Player } from '../types'

// JSON imports are typed loosely (strings, numbers); the data build validates the enums.
export const PLAYERS = playersJson as Player[]

export const PLAYERS_BY_ID: ReadonlyMap<string, Player> = new Map(PLAYERS.map((p) => [p.id, p]))
