import { useEffect, useRef, useState, type ReactNode } from 'react'

/** How long the button stays armed after the first tap. */
export const CONFIRM_TIMEOUT_MS = 3000

interface Props {
  /** Runs on the second tap, if it comes within CONFIRM_TIMEOUT_MS of the first. */
  onConfirm: () => void
  children: ReactNode
  /** Shown (and announced) after the first tap, e.g. "Tap again to give up". */
  armedLabel: ReactNode
  /** Plain-text version of armedLabel for screen readers. */
  armedAnnouncement: string
  className: string
  /** Classes added while armed (a warning look). */
  armedClassName: string
}

/**
 * A button that needs two taps, for actions that end a round. The first tap arms it (it changes
 * to `armedLabel`); a second tap within a few seconds confirms. It disarms on its own after the
 * timeout or when it loses focus. To disarm it after another action, change its React `key`.
 */
export function ConfirmButton({
  onConfirm,
  children,
  armedLabel,
  armedAnnouncement,
  className,
  armedClassName,
}: Props) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const disarm = () => {
    clearTimeout(timer.current)
    setArmed(false)
  }

  const handleClick = () => {
    if (armed) {
      disarm()
      onConfirm()
      return
    }
    setArmed(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setArmed(false), CONFIRM_TIMEOUT_MS)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onBlur={armed ? disarm : undefined}
        className={`${className} ${armed ? armedClassName : ''}`}
      >
        {armed ? armedLabel : children}
      </button>
      <span className="sr-only" aria-live="assertive">
        {armed ? armedAnnouncement : ''}
      </span>
    </>
  )
}
