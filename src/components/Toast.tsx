import { createPortal } from 'react-dom'

interface Props {
  message: string | null
}

/** Small status message near the top of the screen. Always mounted so it is announced. */
export function Toast({ message }: Props) {
  // Portalled so it stays perceivable while a modal makes #root inert.
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4"
    >
      {message && (
        <div className="pop rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg shadow-2xl">
          {message}
        </div>
      )}
    </div>,
    document.body,
  )
}
