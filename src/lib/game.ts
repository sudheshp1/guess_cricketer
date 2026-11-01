import { MAX_GUESSES } from '../config'
import type { SavedGame } from '../types'

export function newGame(puzzleNumber: number): SavedGame {
  return { puzzleNumber, guesses: [], status: 'playing' }
}

/**
 * Apply a guess. Pure: returns the same object when the guess is not allowed (game over or a
 * repeat), so callers can cheaply detect no-ops.
 */
export function submitGuess(
  game: SavedGame,
  playerId: string,
  answerId: string,
  maxGuesses = MAX_GUESSES,
): SavedGame {
  if (game.status !== 'playing' || game.guesses.includes(playerId)) return game
  const guesses = [...game.guesses, playerId]
  const status = playerId === answerId ? 'won' : guesses.length >= maxGuesses ? 'lost' : 'playing'
  return { ...game, guesses, status }
}

/**
 * Make a restored game consistent with today's data: drop unknown or duplicate ids, cap the
 * length, and recompute the status from the guesses themselves.
 */
export function sanitizeGame(
  game: SavedGame,
  answerId: string,
  isKnown: (id: string) => boolean,
  maxGuesses = MAX_GUESSES,
): SavedGame {
  let clean = newGame(game.puzzleNumber)
  for (const id of game.guesses) {
    if (isKnown(id)) clean = submitGuess(clean, id, answerId, maxGuesses)
  }
  return clean
}
