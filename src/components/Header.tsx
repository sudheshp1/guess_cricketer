import { GAME_NAME } from '../config'

interface Props {
  puzzleNumber: number
  onHelp?: () => void
  onStats?: () => void
}

export function Header({ puzzleNumber, onHelp, onStats }: Props) {
  const button =
    'flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:hover:bg-gray-800'
  return (
    <header className="flex items-center justify-between border-b border-gray-200 py-2 dark:border-gray-800">
      <div className="w-20">
        {onHelp && (
          <button type="button" className={button} onClick={onHelp} aria-label="How to play">
            <span aria-hidden="true">?</span>
          </button>
        )}
      </div>
      <h1 className="text-center">
        <span className="block text-2xl font-extrabold tracking-tight">{GAME_NAME}</span>
        <span className="block text-xs text-gray-600 dark:text-gray-400">
          Puzzle #{puzzleNumber}
        </span>
      </h1>
      <div className="flex w-20 justify-end">
        {onStats && (
          <button type="button" className={button} onClick={onStats} aria-label="Statistics">
            <span aria-hidden="true">📊</span>
          </button>
        )}
      </div>
    </header>
  )
}
