import { useEffect, useState } from 'react'
import { formatCountdown, msUntilNextPuzzle } from '../lib/date'

interface Props {
  now?: () => Date
}

const systemNow = () => new Date()

/** Live HH:MM:SS countdown to the next puzzle (IST midnight). */
export function Countdown({ now = systemNow }: Props) {
  const [ms, setMs] = useState(() => msUntilNextPuzzle(now()))
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilNextPuzzle(now())), 1000)
    return () => window.clearInterval(id)
  }, [now])
  return (
    <div className="text-center">
      <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
        Next cricketer in
      </p>
      <p className="font-mono text-2xl font-bold tabular-nums" role="timer" aria-live="off">
        {formatCountdown(ms)}
      </p>
    </div>
  )
}
