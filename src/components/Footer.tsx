export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 py-4 text-center text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
      <p>
        Match data from{' '}
        <a
          href="https://cricsheet.org"
          className="underline hover:text-gray-900 dark:hover:text-gray-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cricsheet
        </a>{' '}
        and{' '}
        <a
          href="https://en.wikipedia.org"
          className="underline hover:text-gray-900 dark:hover:text-gray-200"
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
