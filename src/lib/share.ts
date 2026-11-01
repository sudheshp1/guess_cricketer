import { GAME_NAME, MAX_GUESSES, SITE_URL } from '../config'
import type { GuessResult, Match } from '../types'

const EMOJI: Record<Match, string> = { correct: '🟩', close: '🟨', wrong: '⬜' }

export interface ShareInput {
  puzzleNumber: number
  results: readonly GuessResult[]
  won: boolean
  maxGuesses?: number
  siteUrl?: string
}

/** Spoiler-free share text: header, one emoji row per guess, link. Never contains names. */
export function buildShareText({
  puzzleNumber,
  results,
  won,
  maxGuesses = MAX_GUESSES,
  siteUrl = SITE_URL,
}: ShareInput): string {
  const score = won ? String(results.length) : '✖'
  const rows = results.map((r) => r.cells.map((c) => EMOJI[c.match]).join(''))
  return [`${GAME_NAME} #${puzzleNumber} ${score}/${maxGuesses} 🏏`, ...rows, siteUrl].join('\n')
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
