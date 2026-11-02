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
  type MindMove,
  type MindRound,
  type Mismatch,
} from '../lib/mind'
import { PLAYERS, PLAYERS_BY_ID } from '../lib/players'
import { QUESTIONS_BY_ID, QUESTIONS } from '../lib/questions'
import { loadMindRound, saveMindRound } from '../lib/storage'
import type { MindAnswer, Player } from '../types'

/** Built once: the answer matrix for every player and question. */
export const MIND_ENGINE = createEngine(PLAYERS, QUESTIONS)

/** One line of the round so far, ready to show. */
export type MindHistoryItem =
  | { kind: 'question'; id: string; text: string; answer: MindAnswer }
  | { kind: 'guess'; id: string; player: Player; correct: boolean }

export interface MindReaderView {
  round: MindRound
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
  revealPlayer: (playerId: string) => void
  newRound: () => void
}

export interface UseMindReaderOptions {
  random?: () => number
}

function makeRoundId(random: () => number): string {
  return `m-${Date.now().toString(36)}-${Math.floor(random() * 1e9).toString(36)}`
}

function initialRound(random: () => number): MindRound {
  const saved = loadMindRound()
  return isValidMindRound(saved, MIND_ENGINE) ? saved : newMindRound(makeRoundId(random))
}

export function useMindReader({ random = Math.random }: UseMindReaderOptions = {}): MindReaderView {
  const [round, setRound] = useState<MindRound>(() => initialRound(random))

  const update = useCallback((next: MindRound) => {
    setRound((current) => {
      if (next === current) return current
      saveMindRound(next)
      return next
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

  const revealPlayer = useCallback(
    (playerId: string) => update(reveal(MIND_ENGINE, round, playerId)),
    [round, update],
  )

  const newRound = useCallback(() => {
    const next = newMindRound(makeRoundId(random))
    saveMindRound(next)
    setRound(next)
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
    revealPlayer,
    newRound,
  }
}
