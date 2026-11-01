import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Footer } from './components/Footer'
import { GuessGrid } from './components/GuessGrid'
import { GuessInput } from './components/GuessInput'
import { Header } from './components/Header'
import { HowToPlayModal } from './components/HowToPlayModal'
import { ResultModal } from './components/ResultModal'
import { StatsModal } from './components/StatsModal'
import { Toast } from './components/Toast'
import { FLIP_STAGGER_MS, MAX_GUESSES } from './config'
import { useGame, type UseGameOptions } from './hooks/useGame'
import { describeCell } from './lib/format'
import { PLAYERS, PLAYERS_BY_ID } from './lib/players'
import { buildShareText, shareText } from './lib/share'
import { hasSeenHelp, markHelpSeen } from './lib/storage'
import type { Player } from './types'

type ModalName = 'help' | 'stats' | 'result' | null

/** Time for a full row to flip in before the result modal appears. */
const REVEAL_MS = 7 * FLIP_STAGGER_MS + 400

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function exampleFor(): [Player, Player] | null {
  const guess = PLAYERS_BY_ID.get('virat-kohli') ?? PLAYERS[0]
  const answer = PLAYERS_BY_ID.get('rohit-sharma') ?? PLAYERS[1]
  return guess && answer ? [guess, answer] : null
}

const EXAMPLE = exampleFor()

function App(props: UseGameOptions = {}) {
  const game = useGame(props)
  const over = game.status !== 'playing'
  const [announcement, setAnnouncement] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [modal, setModalState] = useState<ModalName>(() => {
    if (game.status !== 'playing') return 'result'
    return hasSeenHelp() ? null : 'help'
  })
  // A modal shown on page load is part of the first paint, so it doesn't slide in; modals opened
  // later (by the player, or when a game ends) do.
  const [animateModal, setAnimateModal] = useState(false)
  const openModal = useCallback((name: ModalName) => {
    setAnimateModal(true)
    setModalState(name)
  }, [])
  const guessedIds = useMemo(() => game.guesses.map((g) => g.id), [game.guesses])
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (modal === 'help') markHelpSeen()
  }, [modal])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2500)
  }, [])

  const handleGuess = (playerId: string) => {
    const result = game.submit(playerId)
    if (!result) return
    const name = PLAYERS_BY_ID.get(playerId)?.name ?? ''
    const verdict = result.isCorrect ? 'Correct! ' : ''
    setAnnouncement(`${verdict}${name}. ${result.cells.map(describeCell).join('. ')}.`)
    const finished = result.isCorrect || game.guesses.length + 1 >= MAX_GUESSES
    if (finished) {
      window.setTimeout(() => openModal('result'), prefersReducedMotion() ? 0 : REVEAL_MS)
    }
  }

  const handleShare = async () => {
    const text = buildShareText({
      puzzleNumber: game.puzzleNumber,
      results: game.results,
      won: game.status === 'won',
    })
    const outcome = await shareText(text)
    if (outcome === 'copied') showToast('Result copied to clipboard')
    else if (outcome === 'failed') showToast("Couldn't share. Try copying manually.")
  }

  const close = () => setModalState(null)

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-4">
      <Header
        puzzleNumber={game.puzzleNumber}
        onHelp={() => openModal('help')}
        onStats={() => openModal('stats')}
      />
      <main className="flex flex-1 flex-col gap-4 py-4">
        <GuessInput
          players={PLAYERS}
          guessedIds={guessedIds}
          disabled={over}
          guessNumber={game.guesses.length + 1}
          maxGuesses={MAX_GUESSES}
          onGuess={handleGuess}
        />
        {over && (
          <section
            aria-labelledby="result-heading"
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
          >
            <div>
              <h2 id="result-heading" className="font-bold">
                {game.status === 'won'
                  ? `You got it in ${game.guesses.length}/${MAX_GUESSES}!`
                  : 'Out of guesses'}
              </h2>
              <p className="text-sm">
                The answer was <strong>{game.answer.name}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openModal('result')}
              className="shrink-0 rounded-full bg-correct px-4 py-2 text-sm font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              See results
            </button>
          </section>
        )}
        <GuessGrid guesses={game.guesses} results={game.results} animateFrom={game.restoredCount} />
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </main>
      <Footer />

      <HowToPlayModal
        open={modal === 'help'}
        onClose={close}
        example={EXAMPLE}
        animate={animateModal}
      />
      <StatsModal
        open={modal === 'stats'}
        onClose={close}
        stats={game.stats}
        puzzleNumber={game.puzzleNumber}
        highlightGuesses={game.status === 'won' ? game.guesses.length : undefined}
        animate={animateModal}
      />
      {over && (
        <ResultModal
          open={modal === 'result'}
          onClose={close}
          won={game.status === 'won'}
          answer={game.answer}
          results={game.results}
          stats={game.stats}
          puzzleNumber={game.puzzleNumber}
          onShare={() => void handleShare()}
          now={props.now}
          animate={animateModal}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}

export default App
