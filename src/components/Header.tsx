import { ChartColumn, CircleHelp, Flame } from 'lucide-react'
import { CricketBall } from './Icons'

interface Props {
  /** Current win streak (0 hides the flame). */
  streak: number
  onHelp?: () => void
  onStats?: () => void
}

export function Header({ streak, onHelp, onStats }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 py-3 sm:py-5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <CricketBall className="h-9 w-9 sm:h-11 sm:w-11" />
        <div>
          <h1 className="text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
            Cric<span className="text-gold">dle</span>
          </h1>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted sm:text-sm">
            {streak > 0 ? (
              <>
                <Flame className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                <span>Win streak: {streak}</span>
              </>
            ) : (
              <span>Endless mode</span>
            )}
          </p>
        </div>
      </div>
      <nav className="flex items-center gap-2" aria-label="Game menu">
        {onHelp && (
          <button type="button" className="icon-btn" onClick={onHelp} aria-label="How to play">
            <CircleHelp className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        {onStats && (
          <button type="button" className="icon-btn" onClick={onStats} aria-label="Statistics">
            <ChartColumn className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </nav>
    </header>
  )
}
