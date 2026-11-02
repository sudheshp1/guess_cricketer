import { GAME_NAME, MAX_CLUES, MIND_MAX_QUESTIONS, SITE_URL } from '../config'
import type { Round } from '../types'
import type { MindRound } from './mind'

export interface ShareInput {
  round: Pick<Round, 'status' | 'cluesRevealed'>
  streak: number
  maxClues?: number
  siteUrl?: string
}

/**
 * Spoiler-free share text. One square per clue: red for clues used before the answer, green for
 * the clue it was solved on, white for clues never needed. Never contains names.
 */
export function buildShareText({
  round,
  streak,
  maxClues = MAX_CLUES,
  siteUrl = SITE_URL,
}: ShareInput): string {
  const won = round.status === 'won'
  const squares = Array.from({ length: maxClues }, (_, i) => {
    if (!won) return i < round.cluesRevealed ? '🟥' : '⬜'
    if (i < round.cluesRevealed - 1) return '🟥'
    return i === round.cluesRevealed - 1 ? '🟩' : '⬜'
  }).join('')
  const score = won ? `${round.cluesRevealed}/${maxClues}` : `✖/${maxClues}`
  const header = `${GAME_NAME} 🏏 ${score} clues`
  const streakLine = won && streak > 1 ? `🔥 ${streak} in a row` : null
  return [header, squares, ...(streakLine ? [streakLine] : []), siteUrl].join('\n')
}

export interface MindShareInput {
  round: Pick<MindRound, 'status' | 'turns'>
  maxQuestions?: number
  siteUrl?: string
}

/**
 * Spoiler-free Mind Reader share text: one square per question (🟨 asked, ⬜ not needed), then
 * one mark per guess (❌ wrong, ✅ right). Never contains names.
 */
export function buildMindShareText({
  round,
  maxQuestions = MIND_MAX_QUESTIONS,
  siteUrl = SITE_URL,
}: MindShareInput): string {
  const asked = round.turns.filter((t) => t.kind === 'question').length
  const guesses = round.turns.flatMap((t) => (t.kind === 'guess' ? [t.correct ? '✅' : '❌'] : []))
  const squares = Array.from({ length: maxQuestions }, (_, i) => (i < asked ? '🟨' : '⬜')).join('')
  const won = round.status === 'won'
  const header = won
    ? `${GAME_NAME} Mind Reader 🧠 read my mind in ${asked}/${maxQuestions} questions`
    : `${GAME_NAME} Mind Reader 🧠 I beat it!`
  const marks = guesses.length > 0 ? ` ${guesses.join('')}` : ''
  return [header, squares + marks, siteUrl].join('\n')
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

interface ShareEnv {
  share?: (data: ShareData) => Promise<void>
  clipboard?: { writeText: (text: string) => Promise<void> }
}

/**
 * Share via the Web Share API when available, else copy to the clipboard. `env` defaults to the
 * browser's navigator and is injectable for tests.
 */
export async function shareText(
  text: string,
  env: ShareEnv = typeof navigator === 'undefined' ? {} : navigator,
): Promise<ShareOutcome> {
  if (typeof env.share === 'function') {
    try {
      await env.share.call(env, { text })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // Some browsers expose share() but refuse it (e.g. desktop without a share target).
    }
  }
  if (env.clipboard && typeof env.clipboard.writeText === 'function') {
    try {
      await env.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  return 'failed'
}
