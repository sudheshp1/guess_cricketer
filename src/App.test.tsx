import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEYS } from './config'
import { getPuzzleNumber } from './lib/date'
import { PLAYERS } from './lib/players'
import { getAnswer } from './lib/puzzle'

const NOW = new Date('2026-11-05T06:00:00Z')
const now = () => NOW
const answer = getAnswer(getPuzzleNumber(NOW))
const wrongPlayers = PLAYERS.filter((p) => p.id !== answer.id)

function renderApp() {
  return render(<App now={now} />)
}

async function guess(user: ReturnType<typeof userEvent.setup>, name: string) {
  const input = screen.getByRole('combobox')
  await user.clear(input)
  await user.type(input, name)
  const option = screen
    .getAllByRole('option')
    .find((o) => within(o).queryByText(name, { exact: true }))
  if (!option) throw new Error(`No suggestion for ${name}`)
  await user.click(option)
}

const guessNames = () =>
  within(screen.getByRole('list', { name: /your guesses/i }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.font-semibold')?.textContent)

beforeEach(() => {
  window.localStorage.clear()
  // Skip the first-visit help modal; it has its own tests.
  window.localStorage.setItem(STORAGE_KEYS.seenHelp, 'true')
})

describe('App', () => {
  it('renders the title and an empty board', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /cricdle/i })).toBeInTheDocument()
    expect(screen.getByText(/make your first guess/i)).toBeInTheDocument()
  })

  it('suggests players as you type and adds a row per guess, newest first', async () => {
    const user = userEvent.setup()
    renderApp()
    const [first, second] = wrongPlayers
    await guess(user, first!.name)
    await guess(user, second!.name)
    expect(guessNames()).toEqual([second!.name, first!.name])
  })

  it('does not suggest a player you already guessed', async () => {
    const user = userEvent.setup()
    renderApp()
    const p = wrongPlayers[0]!
    await guess(user, p.name)
    await user.type(screen.getByRole('combobox'), p.name)
    expect(screen.queryAllByRole('option').map((o) => o.textContent)).not.toContain(
      `${p.name}${p.country}`,
    )
  })

  it('supports arrow keys, Enter and Escape', async () => {
    const user = userEvent.setup()
    renderApp()
    const input = screen.getByRole('combobox')
    await user.type(input, 'a')
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(1)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowUp}{ArrowUp}')
    const last = screen.getAllByRole('option').at(-1)!
    expect(last).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    // Reopening with ArrowDown starts again at the first suggestion.
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    const first = screen.getAllByRole('option')[0]!
    expect(first).toHaveAttribute('aria-selected', 'true')
    const pickedName = first.querySelector('span')!.textContent
    await user.keyboard('{Enter}')
    expect(guessNames()).toEqual([pickedName])
  })

  it('wins when the answer is guessed and disables input', async () => {
    const user = userEvent.setup()
    renderApp()
    await guess(user, wrongPlayers[0]!.name)
    await guess(user, answer.name)
    expect(screen.getByRole('heading', { name: /you got it in 2\/8/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('loses after 8 wrong guesses and reveals the answer', async () => {
    const user = userEvent.setup()
    renderApp()
    for (const p of wrongPlayers.slice(0, 8)) await guess(user, p.name)
    expect(screen.getByRole('heading', { name: /out of guesses/i })).toBeInTheDocument()
    expect(screen.getByText(answer.name, { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('restores an in-progress game after a reload', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await guess(user, wrongPlayers[0]!.name)
    await guess(user, wrongPlayers[1]!.name)
    first.unmount()

    renderApp()
    expect(guessNames()).toEqual([wrongPlayers[1]!.name, wrongPlayers[0]!.name])
    expect(screen.getByRole('combobox')).toBeEnabled()
    // Restored rows are not re-animated.
    expect(document.querySelectorAll('.cell-flip')).toHaveLength(0)
  })

  it('restores a finished game and counts stats only once', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await guess(user, answer.name)
    first.unmount()
    renderApp()
    expect(screen.getByRole('heading', { name: /you got it in 1\/8/i })).toBeInTheDocument()
    // The results modal reopens on reload.
    expect(screen.getByRole('dialog', { name: /well played/i })).toBeInTheDocument()
    const stats = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.stats)!)
    expect(stats.played).toBe(1)
    expect(stats.wins).toBe(1)
  })

  it('announces each guess result for screen readers', async () => {
    const user = userEvent.setup()
    renderApp()
    await guess(user, wrongPlayers[0]!.name)
    const live = document.querySelector('[aria-live="polite"]')!
    expect(live.textContent).toContain(wrongPlayers[0]!.name)
    expect(live.textContent).toMatch(/Country: /)
  })

  it('still plays when localStorage is unavailable', async () => {
    const user = userEvent.setup()
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError')
      },
    })
    try {
      renderApp()
      await guess(user, answer.name)
      expect(screen.getByRole('heading', { name: /you got it/i })).toBeInTheDocument()
    } finally {
      Object.defineProperty(window, 'localStorage', original)
    }
  })
})
