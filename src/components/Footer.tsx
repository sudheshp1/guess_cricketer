export function Footer() {
  return (
    <footer className="mt-auto border-t border-line py-5 text-center text-xs text-muted">
      <p>
        Match data from{' '}
        <a
          href="https://cricsheet.org"
          className="font-medium underline decoration-line-strong underline-offset-2 hover:text-ink"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cricsheet
        </a>{' '}
        and{' '}
        <a
          href="https://en.wikipedia.org"
          className="font-medium underline decoration-line-strong underline-offset-2 hover:text-ink"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wikipedia
        </a>
        .
      </p>
      <p className="mt-1">Not affiliated with any cricket board or league.</p>
    </footer>
  )
}
