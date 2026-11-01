import type { ReactNode } from 'react'

interface BallProps {
  className?: string
  /** Optional content drawn over the ball (e.g. "?" or initials). */
  children?: ReactNode
  /** Slowly rotate the seam. */
  spin?: boolean
}

/** A red cricket ball with a stitched seam, used for the logo, progress and mystery badge. */
export function CricketBall({ className = 'h-8 w-8', children, spin = false }: BallProps) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 64 64"
        className={`absolute inset-0 h-full w-full ${spin ? 'ball-spin' : ''}`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="ball-shine" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ff8a8a" />
            <stop offset="45%" stopColor="var(--ball)" />
            <stop offset="100%" stopColor="#6b0d0d" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#ball-shine)" />
        <path
          d="M20 6c9 7 9 45 0 52M44 6c-9 7-9 45 0 52"
          fill="none"
          stroke="var(--ball-seam)"
          strokeWidth="2"
          strokeDasharray="3 3.2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      {children !== undefined && (
        <span className="relative font-extrabold text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.5)]">
          {children}
        </span>
      )}
    </span>
  )
}
