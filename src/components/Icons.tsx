/** Inline SVG icons (no emoji: color emoji fonts are slow to lay out and differ by platform). */

interface IconProps {
  className?: string
}

export function HelpIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.9" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function StatsIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 20h16" strokeLinecap="round" />
      <rect x="5.5" y="11" width="3" height="6.5" rx="0.5" />
      <rect x="10.5" y="6" width="3" height="11.5" rx="0.5" />
      <rect x="15.5" y="13.5" width="3" height="4" rx="0.5" />
    </svg>
  )
}

export function BallIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#b91c1c" />
      <path
        d="M7 4.5c3.5 2.8 3.5 12.2 0 15M17 4.5c-3.5 2.8-3.5 12.2 0 15"
        fill="none"
        stroke="#fff"
        strokeWidth="1.2"
        strokeDasharray="1.6 1.6"
      />
    </svg>
  )
}
