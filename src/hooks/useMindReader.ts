import { useCallback, useMemo, useState } from 'react'
import {
  answerGuess,
  answerQuestion,
  concede,
  createEngine,
  guessesMade,
  isValidMindRound,
  mismatches,
  newMindRound,
  nextMove,
  questionsAsked,
  reveal,
  undo,
  type MindMove,
  type MindRound,
  type Mismatch,
} from '../lib/mind'
import { PLAYERS, PLAYERS_BY_ID } from '../lib/players'
import { QUESTIONS_BY_ID, QUESTIONS } from '../lib/questions'
import { recordMindRound } from '../lib/mindStats'
import { loadMindRound, loadMindStats, saveMindRound, saveMindStats } from '../lib/storage'
import type { MindAnswer, MindStats, Player } from '../types'

/** Built once: the answer matrix for every player and question. */
export const MIND_ENGINE = createEngine(PLAYERS, QUESTIONS)

/** One line of the round so far, ready to show. */
export type MindHistoryItem =
  | { kind: 'question'; id: string; text: string; answer: MindAnswer }
  | { kind: 'guess'; id: string; player: Player; correct: boolean }

export interface MindReaderView {
  round: MindRound
  stats: MindStats
  /** What the game wants to know now (null when the round is over). */
  move: MindMove
  history: MindHistoryItem[]
  questionsAsked: number
  guessesMade: number
  /** The player the user revealed after a loss. */
  revealed: Player | null
  /** Answers that disagree with the revealed player's data. */
  mismatches: Mismatch[]
  /** Changes every round (used to reset per-round UI). */
  roundKey: string
  answer: (answer: MindAnswer) => void
  respondToGuess: (correct: boolean) => void
  giveUp: () => void
  /** Take back the last answer while the round is playing. */
  goBack: () => void
  /** Whether there is an answer to take back. */
  canGoBack: boolean
  revealPlayer: (playerId: string) => void
  newRound: () => void
}

export interface UseMindReaderOptions {
  random?: () => number
}

function makeRoundId(random: () => number): string {
  return `m-${Date.now().toString(36)}-${Math.floor(random() * 1e9).toString(36)}`
}

interface State {
  round: MindRound
  stats: MindStats
}

function initialState(random: () => number): State {
  const saved = loadMindRound()
  const stats = loadMindStats()
  if (!isValidMindRound(saved, MIND_ENGINE)) {
    return { round: newMindRound(makeRoundId(random)), stats }
  }
  // Covers a finished round whose stats were never written (e.g. the tab closed mid-save).
  const recorded = recordMindRound(stats, saved)
  if (recorded !== stats) saveMindStats(recorded)
  return { round: saved, stats: recorded }
}

export function useMindReader({ random = Math.random }: UseMindReaderOptions = {}): MindReaderView {
  const [{ round, stats }, setState] = useState<State>(() => initialState(random))

  /** Apply a round update, persist it, and record stats if it just finished. */
  const update = useCallback((next: MindRound) => {
    setState((s) => {
      if (next === s.round) return s
      saveMindRound(next)
      const recorded = recordMindRound(s.stats, next)
      if (recorded !== s.stats) saveMindStats(recorded)
      return { round: next, stats: recorded }
    })
  }, [])

  const move = useMemo(() => nextMove(MIND_ENGINE, round), [round])

  const answer = useCallback(
    (a: MindAnswer) => {
      if (move?.kind !== 'question') return
      update(answerQuestion(MIND_ENGINE, round, move.question.id, a))
    },
    [move, round, update],
  )

  const respondToGuess = useCallback(
    (correct: boolean) => {
      if (move?.kind !== 'guess') return
      update(answerGuess(MIND_ENGINE, round, move.player.id, correct))
    },
    [move, round, update],
  )

  const giveUp = useCallback(() => update(concede(round)), [round, update])
  const goBack = useCallback(() => update(undo(round)), [round, update])

  const revealPlayer = useCallback(
    (playerId: string) => update(reveal(MIND_ENGINE, round, playerId)),
    [round, update],
  )

  const newRound = useCallback(() => {
    const next = newMindRound(makeRoundId(random))
    saveMindRound(next)
    setState((s) => ({ ...s, round: next }))
  }, [random])

  const history = useMemo<MindHistoryItem[]>(
    () =>
      round.turns.flatMap((t): MindHistoryItem[] => {
        if (t.kind === 'question') {
          const q = QUESTIONS_BY_ID.get(t.questionId)
          return q ? [{ kind: 'question', id: q.id, text: q.text, answer: t.answer }] : []
        }
        const player = PLAYERS_BY_ID.get(t.playerId)
        return player ? [{ kind: 'guess', id: player.id, player, correct: t.correct }] : []
      }),
    [round.turns],
  )

  const revealed = round.revealedId ? (PLAYERS_BY_ID.get(round.revealedId) ?? null) : null
  const wrongAnswers = useMemo(
    () => (round.revealedId ? mismatches(MIND_ENGINE, round, round.revealedId) : []),
    [round],
  )

  return {
    round,
    stats,
    move,
    history,
    questionsAsked: questionsAsked(round),
    guessesMade: guessesMade(round),
    revealed,
    mismatches: wrongAnswers,
    roundKey: round.roundId,
    answer,
    respondToGuess,
    giveUp,
    goBack,
    canGoBack: undo(round) !== round,
    revealPlayer,
    newRound,
  }
}
