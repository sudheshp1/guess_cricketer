import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_GUESSES } from '../config'
import { compare } from '../lib/compare'
import { msUntilNextPuzzle } from '../lib/date'
import { newGame, sanitizeGame, submitGuess } from '../lib/game'
import { PLAYERS_BY_ID } from '../lib/players'
import { getTodaysPuzzle, type Puzzle } from '../lib/puzzle'
import { applyGameResult } from '../lib/stats'
import { loadGame, loadStats, saveGame, saveStats } from '../lib/storage'
import type { GuessResult, Player, SavedGame, Stats } from '../types'

export interface UseGameOptions {
  /** Injectable clock for tests. */
  now?: () => Date
}

export interface GameView {
  puzzleNumber: number
  answer: Player
  status: SavedGame['status']
  guesses: Player[]
  results: GuessResult[]
  guessesLeft: number
  /** Number of guesses that were restored from storage (not animated). */
  restoredCount: number
  stats: Stats
  submit: (playerId: string) => GuessResult | null
}

function loadToday(puzzle: Puzzle): SavedGame {
  const saved = loadGame(puzzle.puzzleNumber)
  if (!saved) return newGame(puzzle.puzzleNumber)
  return sanitizeGame(saved, puzzle.answer.id, (id) => PLAYERS_BY_ID.has(id))
}

/** Record a finished game in stats exactly once; returns the (possibly unchanged) stats. */
function recordIfFinished(game: SavedGame, stats: Stats): Stats {
  if (game.status === 'playing') return stats
  const next = applyGameResult(stats, game.puzzleNumber, game.status === 'won', game.guesses.length)
  if (next !== stats) saveStats(next)
  return next
}

export function useGame({ now = () => new Date() }: UseGameOptions = {}): GameView {
  const nowRef = useRef(now)
  useEffect(() => {
    nowRef.current = now
  })

  const [puzzle, setPuzzle] = useState<Puzzle>(() => getTodaysPuzzle(now()))
  const [game, setGame] = useState<SavedGame>(() => loadToday(puzzle))
  const [restoredCount, setRestoredCount] = useState(() => game.guesses.length)
  // Covers a finished game whose stats were never written (e.g. the tab closed mid-save).
  const [stats, setStats] = useState<Stats>(() => recordIfFinished(game, loadStats()))

  // Switch to the new puzzle when IST midnight passes while the page is open.
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        const next = getTodaysPuzzle(nowRef.current())
        if (next.puzzleNumber !== puzzle.puzzleNumber) {
          const nextGame = loadToday(next)
          setPuzzle(next)
          setGame(nextGame)
          setRestoredCount(nextGame.guesses.length)
        }
      },
      msUntilNextPuzzle(nowRef.current()) + 1000,
    )
    return () => window.clearTimeout(timer)
  }, [puzzle.puzzleNumber])

  const submit = useCallback(
    (playerId: string): GuessResult | null => {
      const guess = PLAYERS_BY_ID.get(playerId)
      if (!guess) return null
      const next = submitGuess(game, playerId, puzzle.answer.id, MAX_GUESSES)
      if (next === game) return null
      setGame(next)
      saveGame(next)
      setStats((s) => recordIfFinished(next, s))
      return compare(guess, puzzle.answer)
    },
    [game, puzzle.answer],
  )

  const guesses = useMemo(
    () => game.guesses.map((id) => PLAYERS_BY_ID.get(id)).filter((p): p is Player => !!p),
    [game.guesses],
  )
  const results = useMemo(() => guesses.map((g) => compare(g, puzzle.answer)), [guesses, puzzle])

  return {
    puzzleNumber: puzzle.puzzleNumber,
    answer: puzzle.answer,
    status: game.status,
    guesses,
    results,
    guessesLeft: MAX_GUESSES - game.guesses.length,
    restoredCount,
    stats,
    submit,
  }
}
