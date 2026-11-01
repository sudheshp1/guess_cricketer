import { GAME_NAME } from './config'

function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{GAME_NAME}</h1>
      <p className="text-gray-600 dark:text-gray-400">Guess the mystery cricketer. Coming soon.</p>
    </main>
  )
}

export default App
