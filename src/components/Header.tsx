import { GAME_NAME } from '../config'
import { HelpIcon, StatsIcon } from './Icons'

interface Props {
  /** Short line under the title, e.g. the current streak. */
  subtitle: string
  onHelp?: () => void
  onStats?: () => void
}

export function Header({ subtitle, onHelp, onStats }: Props) {
  const button =
    'flex h-11 w-11 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 focus-visible:outline-2 focus-visible:outline-green-700 dark:hover:bg-gray-800'
  return (
    <header className="flex items-center justify-between border-b border-gray-200 py-2 dark:border-gray-800">
      <div className="w-20">
        {onHelp && (
          <button type="button" className={button} onClick={onHelp} aria-label="How to play">
            <HelpIcon />
          </button>
        )}
      </div>
      <h1 className="text-center">
        <span className="block text-2xl font-extrabold tracking-tight">{GAME_NAME}</span>
        <span className="block text-xs text-gray-600 dark:text-gray-400">{subtitle}</span>
      </h1>
      <div className="flex w-20 justify-end">
        {onStats && (
          <button type="button" className={button} onClick={onStats} aria-label="Statistics">
            <StatsIcon />
          </button>
        )}
      </div>
    </header>
  )
}
