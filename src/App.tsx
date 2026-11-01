import { useMemo, useState } from 'react'
import { Footer } from './components/Footer'
import { GuessGrid } from './components/GuessGrid'
import { GuessInput } from './components/GuessInput'
import { Header } from './components/Header'
import { MAX_GUESSES } from './config'
import { describeCell } from './lib/format'
import { PLAYERS, PLAYERS_BY_ID } from './lib/players'
import { useGame, type UseGameOptions } from './hooks/useGame'

function App(props: UseGameOptions = {}) {
  const game = useGame(props)
  const [announcement, setAnnouncement] = useState('')
  const guessedIds = useMemo(() => game.guesses.map((g) => g.id), [game.guesses])
  const over = game.status !== 'playing'

  const handleGuess = (playerId: string) => {
    const result = game.submit(playerId)
    if (!result) return
    const name = PLAYERS_BY_ID.get(playerId)?.name ?? ''
    const verdict = result.isCorrect ? 'Correct! ' : ''
    setAnnouncement(`${verdict}${name}. ${result.cells.map(describeCell).join('. ')}.`)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-4">
      <Header puzzleNumber={game.puzzleNumber} />
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
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900"
          >
            <h2 id="result-heading" className="text-lg font-bold">
              {game.status === 'won'
                ? `You got it in ${game.guesses.length}/${MAX_GUESSES}!`
                : 'Out of guesses'}
            </h2>
            <p className="mt-1 text-sm">
              The answer was <strong>{game.answer.name}</strong>.
            </p>
          </section>
        )}
        <GuessGrid guesses={game.guesses} results={game.results} animateFrom={game.restoredCount} />
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default App
