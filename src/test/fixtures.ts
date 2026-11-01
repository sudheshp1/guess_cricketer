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
    lastYear: 2026,
    difficulty: 1,
    stats: {
      test: {
        matches: 100,
        runs: 7000,
        highScore: '254*',
        hundreds: 20,
        fifties: 30,
        wickets: 5,
        bestBowling: '2/30',
      },
      odi: {
        matches: 200,
        runs: 8000,
        highScore: '183',
        hundreds: 25,
        fifties: 40,
        wickets: 10,
        bestBowling: '3/20',
      },
    },
    statsAsOf: '1 October 2026',
    ...overrides,
  }
}
