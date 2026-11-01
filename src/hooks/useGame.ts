import { useCallback, useMemo, useState } from 'react'
import { buildClues } from '../lib/clues'
import { PLAYERS, PLAYERS_BY_ID } from '../lib/players'
import { giveUp, guess, isValidRound, newRound, pickAnswer, revealClue } from '../lib/round'
import { recordRound } from '../lib/stats'
import {
  loadPool,
  loadRecent,
  loadRound,
  loadStats,
  rememberAnswer,
  savePool,
  saveRound,
  saveStats,
} from '../lib/storage'
import type { Clue, Player, PlayerPool, Round, Stats } from '../types'

export interface UseGameOptions {
  /** Injectable randomness for tests; returns [0, 1). */
  random?: () => number
}

export interface GameView {
  round: Round
  answer: Player
  clues: Clue[]
  guesses: Player[]
  stats: Stats
  pool: PlayerPool
  /** Number of rounds started this session (used to reset per-round UI). */
  roundKey: string
  submitGuess: (playerId: string) => 'correct' | 'wrong' | 'ignored'
  nextClue: () => void
  surrender: () => void
  nextRound: () => void
  setPool: (pool: PlayerPool) => void
}

function makeRoundId(random: () => number): string {
  return `${Date.now().toString(36)}-${Math.floor(random() * 1e9).toString(36)}`
}

interface State {
  round: Round
  stats: Stats
  recent: string[]
  pool: PlayerPool
}

function startRound(state: Omit<State, 'round'>, random: () => number): State {
  const answer = pickAnswer(PLAYERS, state.pool, state.recent, random)
  const round = newRound(answer.id, makeRoundId(random))
  saveRound(round)
  return { ...state, round, recent: rememberAnswer(state.recent, answer.id) }
}

function initialState(random: () => number): State {
  const pool = loadPool()
  const recent = loadRecent()
  const saved = loadRound()
  const stats = loadStats()
  if (saved && isValidRound(saved, (id) => PLAYERS_BY_ID.has(id))) {
    // Covers a finished round whose stats were never written (e.g. the tab closed mid-save).
    const recorded = recordRound(stats, saved)
    if (recorded !== stats) saveStats(recorded)
    return { round: saved, stats: recorded, recent, pool }
  }
  return startRound({ stats, recent, pool }, random)
}

export function useGame({ random = Math.random }: UseGameOptions = {}): GameView {
  const [state, setState] = useState<State>(() => initialState(random))

  /** Apply a round update, persist it, and record stats if it just finished. */
  const update = useCallback((next: Round) => {
    setState((s) => {
      if (next === s.round) return s
      saveRound(next)
      const stats = recordRound(s.stats, next)
      if (stats !== s.stats) saveStats(stats)
      return { ...s, round: next, stats }
    })
  }, [])

  const submitGuess = useCallback(
    (playerId: string): 'correct' | 'wrong' | 'ignored' => {
      if (!PLAYERS_BY_ID.has(playerId)) return 'ignored'
      const next = guess(state.round, playerId)
      if (next === state.round) return 'ignored'
      update(next)
      return next.status === 'won' ? 'correct' : 'wrong'
    },
    [state.round, update],
  )

  const nextClue = useCallback(() => update(revealClue(state.round)), [state.round, update])
  const surrender = useCallback(() => update(giveUp(state.round)), [state.round, update])

  const nextRound = useCallback(() => {
    setState((s) => startRound({ stats: s.stats, recent: s.recent, pool: s.pool }, random))
  }, [random])

  const setPool = useCallback((pool: PlayerPool) => {
    savePool(pool)
    setState((s) => ({ ...s, pool }))
  }, [])

  const answer = PLAYERS_BY_ID.get(state.round.answerId)!
  const clues = useMemo(() => buildClues(answer), [answer])
  const guesses = useMemo(
    () => state.round.guesses.map((id) => PLAYERS_BY_ID.get(id)).filter((p): p is Player => !!p),
    [state.round.guesses],
  )

  return {
    round: state.round,
    answer,
    clues,
    guesses,
    stats: state.stats,
    pool: state.pool,
    roundKey: state.round.roundId,
    submitGuess,
    nextClue,
    surrender,
    nextRound,
    setPool,
  }
}
