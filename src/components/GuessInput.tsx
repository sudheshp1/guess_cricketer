import { Search } from 'lucide-react'
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { searchPlayers } from '../lib/search'
import type { Player } from '../types'

interface Props {
  players: readonly Player[]
  guessedIds: readonly string[]
  disabled?: boolean
  placeholder: string
  autoFocus?: boolean
  onGuess: (playerId: string) => void
}

/** Text input with an accessible autocomplete listbox (WAI-ARIA combobox pattern). */
export function GuessInput({
  players,
  guessedIds,
  disabled,
  placeholder,
  autoFocus,
  onGuess,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const inputId = useId()

  const results = useMemo(
    () => searchPlayers(players, query, guessedIds),
    [players, query, guessedIds],
  )
  const showList = open && results.length > 0 && !disabled
  const noMatches = open && query.trim() !== '' && results.length === 0

  const choose = (player: Player) => {
    onGuess(player.id)
    setQuery('')
    setOpen(false)
    setActive(0)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!showList) {
        // A closed list reopens at the first suggestion.
        setOpen(true)
        setActive(0)
        return
      }
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = results[active]
      if (showList && pick) choose(pick)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Guess a cricketer
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="go"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="w-full rounded-2xl border-2 border-line-strong bg-surface py-3.5 pr-4 pl-12 text-base font-medium text-ink outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_4px_rgb(34_197_94/0.18)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label="Matching players"
        hidden={!showList}
        className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-line bg-elevated p-1.5 shadow-2xl"
      >
        {results.map((p, i) => (
          <li
            key={p.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // mousedown fires before the input's blur closes the list.
            onMouseDown={(e) => {
              e.preventDefault()
              choose(p)
            }}
            onMouseEnter={() => setActive(i)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 ${
              i === active ? 'bg-brand-soft' : ''
            }`}
          >
            <span className="font-semibold text-ink">{p.name}</span>
            <span className="shrink-0 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
              {p.country}
            </span>
          </li>
        ))}
      </ul>
      {noMatches && (
        <p className="mt-2 px-1 text-sm text-muted" role="status">
          No matching players{guessedIds.length ? " (or you've already guessed them)" : ''}.
        </p>
      )}
    </div>
  )
}
