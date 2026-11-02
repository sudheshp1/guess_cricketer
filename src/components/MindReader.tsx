import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { MindReaderView } from '../hooks/useMindReader'
import type { MindAnswer } from '../types'
import { MindHero } from './MindHero'
import { MindHistory } from './MindHistory'
import { MindQuestionCard } from './MindQuestionCard'
import { MindResult } from './MindResult'

interface Props {
  mind: MindReaderView
  onShare?: () => void
}

/** Is the user typing in a field? Then letter shortcuts must not fire. */
function typingIn(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/** Mind Reader mode: the user thinks of a player and answers the game's questions. */
export function MindReader({ mind, onShare }: Props) {
  const { round, move, history } = mind
  const playing = round.status === 'playing'
  // A fresh round waits for "Start" so the user has time to pick a player.
  const [started, setStarted] = useState(history.length > 0)
  // Focus and announce only after the user has interacted this session (not on page load).
  const [interacted, setInteracted] = useState(false)

  let announcement = ''
  if (interacted) {
    if (round.status === 'won') announcement = 'I got it!'
    else if (round.status === 'lost') {
      announcement = mind.revealed
        ? `You were thinking of ${mind.revealed.name}.`
        : 'You beat me. Who were you thinking of?'
    } else if (!started) announcement = 'New round. Think of a cricketer, then press Start.'
    else if (move?.kind === 'question') {
      announcement = `Question ${mind.questionsAsked + 1}: ${move.question.text}`
    } else if (move) announcement = `My guess: is your player ${move.player.name}?`
  }

  const handleAnswer = (answer: MindAnswer) => {
    setInteracted(true)
    mind.answer(answer)
  }
  const handleGuessResponse = (correct: boolean) => {
    setInteracted(true)
    mind.respondToGuess(correct)
  }

  // Keyboard shortcuts: Y / N / ? (or U) while a question or guess is showing.
  useEffect(() => {
    if (!started || !playing || !move) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typingIn(e.target)) return
      if (document.querySelector('[role="dialog"]')) return
      const key = e.key.toLowerCase()
      if (move.kind === 'question') {
        const answer: MindAnswer | null =
          key === 'y' ? 'yes' : key === 'n' ? 'no' : key === '?' || key === 'u' ? 'unsure' : null
        if (!answer) return
        e.preventDefault()
        setInteracted(true)
        mind.answer(answer)
      } else if (key === 'y' || key === 'n') {
        e.preventDefault()
        setInteracted(true)
        mind.respondToGuess(key === 'y')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, playing, move, mind])

  const handlePlayAgain = () => {
    mind.newRound()
    setStarted(false)
    setInteracted(true)
  }

  const handleStart = () => {
    setStarted(true)
    setInteracted(true)
  }

  const lastAnswer = history.at(-1)
  const guessed = round.status === 'won' && lastAnswer?.kind === 'guess' ? lastAnswer.player : null

  return (
    <main className="flex flex-1 flex-col gap-5 pt-2 pb-6 sm:gap-6 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] lg:content-start lg:items-start lg:gap-x-10 lg:gap-y-8 2xl:grid-cols-[minmax(0,2fr)_minmax(440px,1fr)]">
      <section
        aria-labelledby="mind-heading"
        className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-start-1 lg:row-start-1"
      >
        <MindHero
          status={round.status}
          questionsAsked={mind.questionsAsked}
          guessesMade={mind.guessesMade}
        />

        {!started && playing ? (
          <section aria-labelledby="mind-intro-heading" className="card clue-in p-5 sm:p-6">
            <p className="eyebrow">How it works</p>
            <h3
              id="mind-intro-heading"
              className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
            >
              Think of any international cricketer
            </h3>
            <p className="mt-2 text-muted">
              Keep them in your head. I&rsquo;ll ask up to 10 yes/no questions, then try to name
              them in 3 guesses or fewer. Answer &ldquo;Not sure&rdquo; if you don&rsquo;t know.
            </p>
            <button
              type="button"
              onClick={handleStart}
              autoFocus={interacted}
              className="btn btn-primary mt-4 text-base"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              I&rsquo;ve got one. Start!
            </button>
          </section>
        ) : playing && move ? (
          <MindQuestionCard
            key={move.kind === 'question' ? move.question.id : `guess-${move.player.id}`}
            move={move}
            number={mind.questionsAsked + 1}
            autoFocus={interacted}
            onAnswer={handleAnswer}
            onGuessResponse={handleGuessResponse}
            onGiveUp={() => {
              setInteracted(true)
              mind.giveUp()
            }}
          />
        ) : (
          <MindResult
            round={round}
            questionsAsked={mind.questionsAsked}
            guessed={guessed}
            revealed={mind.revealed}
            mismatches={mind.mismatches}
            onReveal={mind.revealPlayer}
            onPlayAgain={handlePlayAgain}
            onShare={onShare}
          />
        )}
      </section>

      <aside
        aria-label="Round so far"
        className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1"
      >
        <MindHistory items={history} />
        {history.length === 0 && (playing || started) && (
          <div className="card hidden p-4 text-sm text-muted sm:p-5 lg:block">
            Your answers will appear here.
          </div>
        )}
      </aside>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </main>
  )
}
