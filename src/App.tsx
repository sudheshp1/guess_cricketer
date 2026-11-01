import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClueList } from './components/ClueList'
import { Footer } from './components/Footer'
import { GuessInput } from './components/GuessInput'
import { Header } from './components/Header'
import { HowToPlayModal } from './components/HowToPlayModal'
import { PoolPicker } from './components/PoolPicker'
import { RoundResult } from './components/RoundResult'
import { StatsModal } from './components/StatsModal'
import { Toast } from './components/Toast'
import { MAX_CLUES } from './config'
import { useGame, type UseGameOptions } from './hooks/useGame'
import { PLAYERS, PLAYERS_BY_ID } from './lib/players'
import { buildShareText, shareText } from './lib/share'
import { hasSeenHelp, markHelpSeen } from './lib/storage'

type ModalName = 'help' | 'stats' | null

function App(props: UseGameOptions = {}) {
  const game = useGame(props)
  const { round } = game
  const playing = round.status === 'playing'
  const [announcement, setAnnouncement] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [modal, setModalState] = useState<ModalName>(() => (hasSeenHelp() ? null : 'help'))
  // A modal shown on page load is part of the first paint, so it doesn't slide in.
  const [animateModal, setAnimateModal] = useState(false)
  // Focus the input for rounds started in this session, not on page load.
  const [roundsStarted, setRoundsStarted] = useState(0)
  const toastTimer = useRef<number | undefined>(undefined)
  const guessedIds = useMemo(() => game.guesses.map((g) => g.id), [game.guesses])

  const openModal = useCallback((name: ModalName) => {
    setAnimateModal(true)
    setModalState(name)
  }, [])

  useEffect(() => {
    if (modal === 'help') markHelpSeen()
  }, [modal])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2500)
  }, [])

  const announceClue = (index: number) => {
    const clue = game.clues[index]
    return clue ? `Clue ${index + 1}, ${clue.title}: ${clue.text}.` : ''
  }

  const handleGuess = (playerId: string) => {
    const name = PLAYERS_BY_ID.get(playerId)?.name ?? ''
    const outcome = game.submitGuess(playerId)
    if (outcome === 'correct') {
      setAnnouncement(`Correct! It was ${name}.`)
    } else if (outcome === 'wrong') {
      setAnnouncement(
        round.cluesRevealed >= MAX_CLUES
          ? `Not ${name}. Out of clues. It was ${game.answer.name}.`
          : `Not ${name}. ${announceClue(round.cluesRevealed)}`,
      )
    }
  }

  const handleNextClue = () => {
    game.nextClue()
    setAnnouncement(announceClue(round.cluesRevealed))
  }

  const handleGiveUp = () => {
    game.surrender()
    setAnnouncement(`The answer was ${game.answer.name}.`)
  }

  const handleNextRound = () => {
    game.nextRound()
    setRoundsStarted((n) => n + 1)
    setAnnouncement('New player. Clue 1 is showing.')
  }

  const handleShare = async () => {
    const text = buildShareText({ round, streak: game.stats.currentStreak })
    const outcome = await shareText(text)
    if (outcome === 'copied') showToast('Result copied to clipboard')
    else if (outcome === 'failed') showToast("Couldn't share. Try copying manually.")
  }

  const streak = game.stats.currentStreak
  const subtitle = streak > 0 ? `Win streak: ${streak}` : 'Endless mode'

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-4">
      <Header
        subtitle={subtitle}
        onHelp={() => openModal('help')}
        onStats={() => openModal('stats')}
      />
      <main className="flex flex-1 flex-col gap-4 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Who is this cricketer?</h2>
          <p className="text-sm text-gray-600 tabular-nums dark:text-gray-400">
            Clue {round.cluesRevealed} of {MAX_CLUES}
          </p>
        </div>

        <ClueList
          clues={game.clues}
          to={round.cluesRevealed}
          highlightLatest={playing}
          showLocked={playing}
        />

        {playing ? (
          <div className="flex flex-col gap-2">
            <GuessInput
              key={game.roundKey}
              players={PLAYERS}
              guessedIds={guessedIds}
              placeholder="Type a player's name"
              autoFocus={roundsStarted > 0}
              onGuess={handleGuess}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleNextClue}
                disabled={round.cluesRevealed >= MAX_CLUES}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Another clue
              </button>
              <button
                type="button"
                onClick={handleGiveUp}
                className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Give up
              </button>
            </div>
          </div>
        ) : (
          <RoundResult
            round={round}
            answer={game.answer}
            onNext={handleNextRound}
            onShare={() => void handleShare()}
          />
        )}

        {!playing && round.cluesRevealed < game.clues.length && (
          <section aria-labelledby="other-clues-heading">
            <h3
              id="other-clues-heading"
              className="mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400"
            >
              {round.status === 'won' ? 'Clues you didn’t need' : 'The other clues'}
            </h3>
            <ClueList
              clues={game.clues}
              from={round.cluesRevealed}
              to={game.clues.length}
              label="Remaining clues"
            />
          </section>
        )}

        {game.guesses.length > 0 && (
          <section aria-labelledby="guesses-heading">
            <h3
              id="guesses-heading"
              className="mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400"
            >
              Your guesses
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {game.guesses.map((p) => {
                const correct = p.id === round.answerId
                return (
                  <li
                    key={p.id}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      correct
                        ? 'bg-correct text-white'
                        : 'bg-gray-100 text-gray-800 line-through decoration-red-600 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {p.name}
                    <span className="sr-only">{correct ? ' (correct)' : ' (wrong)'}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <div className="mt-2">
          <PoolPicker pool={game.pool} onChange={game.setPool} />
          <p className="mt-1 text-center text-xs text-gray-600 dark:text-gray-400">
            Applies from the next player.
          </p>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </main>
      <Footer />

      <HowToPlayModal
        open={modal === 'help'}
        onClose={() => setModalState(null)}
        animate={animateModal}
      />
      <StatsModal
        open={modal === 'stats'}
        onClose={() => setModalState(null)}
        stats={game.stats}
        highlightClue={round.status === 'won' ? round.cluesRevealed : undefined}
        animate={animateModal}
      />
      <Toast message={toast} />
    </div>
  )
}

export default App
