import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { searchPlayers } from '../lib/search'
import type { Player } from '../types'

interface Props {
  players: readonly Player[]
  guessedIds: readonly string[]
  disabled?: boolean
  guessNumber: number
  maxGuesses: number
  onGuess: (playerId: string) => void
}

/** Text input with an accessible autocomplete listbox (WAI-ARIA combobox pattern). */
export function GuessInput({
  players,
  guessedIds,
  disabled,
  guessNumber,
  maxGuesses,
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
        placeholder={
          disabled ? 'Game over' : `Guess ${guessNumber} of ${maxGuesses}: type a player's name`
        }
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none placeholder:text-gray-500 focus:border-green-700 focus:ring-2 focus:ring-green-700/30 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400 dark:disabled:bg-gray-800"
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Matching players"
        hidden={!showList}
        className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
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
            className={`flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2.5 ${
              i === active ? 'bg-green-50 dark:bg-green-950' : ''
            }`}
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
            <span className="shrink-0 text-xs text-gray-600 dark:text-gray-400">{p.country}</span>
          </li>
        ))}
      </ul>
      {noMatches && (
        <p className="mt-1 px-1 text-sm text-gray-600 dark:text-gray-400" role="status">
          No matching players{guessedIds.length ? " (or you've already guessed them)" : ''}.
        </p>
      )}
    </div>
  )
}
