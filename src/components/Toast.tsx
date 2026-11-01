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
      className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4"
    >
      {message && (
        <div className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {message}
        </div>
      )}
    </div>,
    document.body,
  )
}
