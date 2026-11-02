import { Check, Flag, Lightbulb, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClueList } from './components/ClueList'
import { Footer } from './components/Footer'
import { GuessInput } from './components/GuessInput'
import { Header } from './components/Header'
import { HowToPlayModal } from './components/HowToPlayModal'
import { MindReader } from './components/MindReader'
import { ModeSwitch } from './components/ModeSwitch'
import { PoolPicker } from './components/PoolPicker'
import { RoundHero } from './components/RoundHero'
import { RoundResult } from './components/RoundResult'
import { StatsModal } from './components/StatsModal'
import { Toast } from './components/Toast'
import { MAX_CLUES } from './config'
import { useGame, type UseGameOptions } from './hooks/useGame'
import { useMindReader } from './hooks/useMindReader'
import { PLAYERS, PLAYERS_BY_ID } from './lib/players'
import { buildMindShareText, buildShareText, shareText } from './lib/share'
import { hasSeenHelp, loadMode, markHelpSeen, saveMode } from './lib/storage'
import type { GameMode } from './types'

type ModalName = 'help' | 'stats' | null

function App(props: UseGameOptions = {}) {
  const game = useGame(props)
  const mind = useMindReader(props)
  const [mode, setModeState] = useState<GameMode>(() => loadMode())
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

  const setMode = useCallback((next: GameMode) => {
    saveMode(next)
    setModeState(next)
  }, [])

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

  const share = async (text: string) => {
    const outcome = await shareText(text)
    if (outcome === 'copied') showToast('Result copied to clipboard')
    else if (outcome === 'failed') showToast("Couldn't share. Try copying manually.")
  }

  const handleShare = () => share(buildShareText({ round, streak: game.stats.currentStreak }))
  const handleMindShare = () => void share(buildMindShareText({ round: mind.round }))

  return (
    <div className="flex min-h-dvh w-full flex-col px-4 sm:px-6 lg:px-10 2xl:px-16">
      <Header
        streak={mode === 'clues' ? game.stats.currentStreak : 0}
        onHelp={() => openModal('help')}
        onStats={() => openModal('stats')}
      />
      <ModeSwitch mode={mode} onChange={setMode} />
      {mode === 'mind' ? (
        <MindReader mind={mind} onShare={handleMindShare} />
      ) : (
        /*
        Phones/tablets: one full-width column (clues, then the panel, then leftover clues).
        lg+: clues on the left, a sticky panel on the right, filling the window.
      */
        <main className="flex flex-1 flex-col gap-5 pt-2 pb-6 sm:gap-6 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] lg:content-start lg:items-start lg:gap-x-10 lg:gap-y-8 2xl:grid-cols-[minmax(0,2fr)_minmax(440px,1fr)]">
          <section
            aria-labelledby="clues-heading"
            className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-start-1 lg:row-start-1"
          >
            <RoundHero round={round} answer={game.answer} />
            <ClueList
              clues={game.clues}
              to={round.cluesRevealed}
              highlightLatest={playing}
              showLocked={playing}
            />
          </section>

          <aside
            aria-label="Your answer"
            className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            {playing ? (
              <div className="card flex flex-col gap-3 p-4 sm:p-5">
                <p className="eyebrow">Your guess</p>
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
                    className="btn btn-ghost flex-1"
                  >
                    <Lightbulb className="h-4.5 w-4.5 text-gold" aria-hidden="true" />
                    Another clue
                  </button>
                  <button type="button" onClick={handleGiveUp} className="btn btn-ghost">
                    <Flag className="h-4.5 w-4.5 text-muted" aria-hidden="true" />
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

            {game.guesses.length > 0 && (
              <section aria-labelledby="guesses-heading" className="card p-4 sm:p-5">
                <h3 id="guesses-heading" className="eyebrow mb-2.5">
                  Your guesses
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {game.guesses.map((p) => {
                    const correct = p.id === round.answerId
                    return (
                      <li
                        key={p.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                          correct
                            ? 'bg-brand text-on-brand'
                            : 'border border-line bg-surface-2 text-ink'
                        }`}
                      >
                        {correct ? (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <X className="h-4 w-4 text-danger" aria-hidden="true" />
                        )}
                        {p.name}
                        <span className="sr-only">{correct ? ' (correct)' : ' (wrong)'}</span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            <div className="card p-4 sm:p-5">
              <PoolPicker pool={game.pool} onChange={game.setPool} />
            </div>
          </aside>

          {!playing && round.cluesRevealed < game.clues.length && (
            <section
              aria-labelledby="other-clues-heading"
              className="min-w-0 lg:col-start-1 lg:row-start-2"
            >
              <h3 id="other-clues-heading" className="eyebrow mb-3">
                {round.status === 'won' ? 'Clues you didn\u2019t need' : 'The other clues'}
              </h3>
              <ClueList
                clues={game.clues}
                from={round.cluesRevealed}
                to={game.clues.length}
                label="Remaining clues"
              />
            </section>
          )}

          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </p>
        </main>
      )}
      <Footer />

      <HowToPlayModal
        open={modal === 'help'}
        onClose={() => setModalState(null)}
        animate={animateModal}
      />
      <StatsModal
        key={modal === 'stats' ? mode : 'closed'}
        open={modal === 'stats'}
        onClose={() => setModalState(null)}
        stats={game.stats}
        mindStats={mind.stats}
        initialTab={mode}
        highlightClue={round.status === 'won' ? round.cluesRevealed : undefined}
        highlightQuestions={mind.round.status === 'won' ? mind.questionsAsked : undefined}
        animate={animateModal}
      />
      <Toast message={toast} />
    </div>
  )
}

export default App
