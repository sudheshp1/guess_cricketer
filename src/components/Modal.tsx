import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Props {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Slide in when opened (skip for dialogs shown on page load, so first paint is final). */
  animate?: boolean
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal: focus moves in on open and back to the opener on close, Tab is trapped inside,
 * Escape and backdrop clicks close it, and the page behind is hidden from assistive tech.
 */
export function Modal({ title, open, onClose, children, animate = true }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    root?.setAttribute('aria-hidden', 'true')
    root?.setAttribute('inert', '')
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      } else if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
        if (items.length === 0) {
          e.preventDefault()
          return
        }
        const first = items[0]!
        const last = items[items.length - 1]!
        const current = document.activeElement
        if (e.shiftKey && (current === first || current === panelRef.current)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && current === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      root?.removeAttribute('aria-hidden')
      root?.removeAttribute('inert')
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null

  // Portalled to <body> so that making #root inert doesn't disable the dialog itself.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${animate ? 'modal-in ' : ''}max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-elevated p-5 text-ink shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl sm:p-6`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-extrabold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="icon-btn -m-1 shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
