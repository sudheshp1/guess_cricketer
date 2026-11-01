import type { Player } from '../types'

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'answer',
    name: 'Answer Player',
    aliases: [],
    country: 'India',
    role: 'Batter',
    battingHand: 'Right',
    bowlingType: 'Right-arm off-spin',
    debutYear: 2010,
    intlMatches: 300,
    active: true,
    difficulty: 1,
    ...overrides,
  }
}
