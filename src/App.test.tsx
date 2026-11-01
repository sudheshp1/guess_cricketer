import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { MAX_CLUES, STORAGE_KEYS } from './config'
import { PLAYERS } from './lib/players'
import { pickAnswer } from './lib/round'

// random() === 0 always picks the first eligible player that isn't recent.
const random = () => 0
const answer = pickAnswer(PLAYERS, 'regular', [], random)
const secondAnswer = pickAnswer(PLAYERS, 'regular', [answer.id], random)
const wrongPlayers = PLAYERS.filter((p) => p.id !== answer.id && p.id !== secondAnswer.id)

function renderApp() {
  return render(<App random={random} />)
}

type User = ReturnType<typeof userEvent.setup>

async function guess(user: User, name: string) {
  const input = screen.getByRole('combobox')
  await user.clear(input)
  await user.type(input, name)
  const option = screen
    .getAllByRole('option')
    .find((o) => within(o).queryByText(name, { exact: true }))
  if (!option) throw new Error(`No suggestion for ${name}`)
  await user.click(option)
}

const clueItems = () =>
  within(screen.getByRole('list', { name: 'Clues' }))
    .getAllByRole('listitem')
    .filter((li) => !/locked/.test(li.textContent ?? ''))

beforeEach(() => {
  window.localStorage.clear()
  // Skip the first-visit help modal; it has its own test.
  window.localStorage.setItem(STORAGE_KEYS.seenHelp, 'true')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('starts a round with one clue showing', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /who is this cricketer/i })).toBeInTheDocument()
    expect(screen.getByText(`Clue 1 of ${MAX_CLUES}`)).toBeInTheDocument()
    expect(clueItems()).toHaveLength(1)
    expect(screen.getByText(`${MAX_CLUES - 1} more clues locked`)).toBeInTheDocument()
  })

  it('reveals the next clue after each wrong guess', async () => {
    const user = userEvent.setup()
    renderApp()
    await guess(user, wrongPlayers[0]!.name)
    expect(clueItems()).toHaveLength(2)
    expect(screen.getByText(`Clue 2 of ${MAX_CLUES}`)).toBeInTheDocument()
    await guess(user, wrongPlayers[1]!.name)
    expect(clueItems()).toHaveLength(3)
    const guesses = within(screen.getByRole('region', { name: /your guesses/i }))
    expect(guesses.getByText(wrongPlayers[0]!.name)).toBeInTheDocument()
  })

  it('reveals a clue on demand without guessing', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: /another clue/i }))
    expect(clueItems()).toHaveLength(2)
    expect(screen.queryByRole('region', { name: /your guesses/i })).not.toBeInTheDocument()
  })

  it('wins when the answer is guessed, then starts a new round', async () => {
    const user = userEvent.setup()
    renderApp()
    await guess(user, wrongPlayers[0]!.name)
    await guess(user, answer.name)
    expect(screen.getByRole('heading', { name: /got it on clue 2/i })).toBeInTheDocument()
    expect(screen.getByText(answer.name, { selector: 'strong' })).toBeInTheDocument()
    // The remaining clues are listed once the round is over.
    expect(
      within(screen.getByRole('list', { name: 'Remaining clues' })).getAllByRole('listitem'),
    ).toHaveLength(MAX_CLUES - 2)
    expect(screen.getByText('Win streak: 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next player/i }))
    expect(clueItems()).toHaveLength(1)
    expect(screen.getByRole('combobox')).toHaveFocus()
    // The new round has a different answer.
    await guess(user, secondAnswer.name)
    expect(screen.getByRole('heading', { name: /first clue/i })).toBeInTheDocument()
    expect(screen.getByText('Win streak: 2')).toBeInTheDocument()
  })

  it('loses after a wrong guess on the last clue', async () => {
    const user = userEvent.setup()
    renderApp()
    const more = screen.getByRole('button', { name: /another clue/i })
    for (let i = 1; i < MAX_CLUES; i++) await user.click(more)
    expect(more).toBeDisabled()
    await guess(user, wrongPlayers[0]!.name)
    expect(screen.getByRole('heading', { name: /out of clues/i })).toBeInTheDocument()
    expect(screen.getByText(answer.name, { selector: 'strong' })).toBeInTheDocument()
  })

  it('can give up and reveal the answer', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: /give up/i }))
    expect(screen.getByRole('heading', { name: /you gave up/i })).toBeInTheDocument()
    expect(screen.getByText(answer.name, { selector: 'strong' })).toBeInTheDocument()
    const stats = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.stats)!)
    expect(stats).toMatchObject({ played: 1, wins: 0, currentStreak: 0 })
  })

  it('restores the current round after a reload', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await guess(user, wrongPlayers[0]!.name)
    first.unmount()
    renderApp()
    expect(clueItems()).toHaveLength(2)
    expect(screen.getByText(wrongPlayers[0]!.name)).toBeInTheDocument()
  })

  it('restores a finished round and counts it once', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await guess(user, answer.name)
    first.unmount()
    renderApp()
    expect(screen.getByRole('button', { name: /next player/i })).toBeInTheDocument()
    const stats = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.stats)!)
    expect(stats).toMatchObject({ played: 1, wins: 1 })
  })

  it('changes the player pool for the next round', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('radio', { name: 'Famous' }))
    expect(window.localStorage.getItem(STORAGE_KEYS.pool)).toBe('"famous"')
    await user.click(screen.getByRole('button', { name: /give up/i }))
    await user.click(screen.getByRole('button', { name: /next player/i }))
    const round = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.round)!)
    const next = PLAYERS.find((p) => p.id === round.answerId)!
    expect(next.difficulty).toBe(1)
  })

  it('shows How to play on the first visit only', async () => {
    window.localStorage.clear()
    const user = userEvent.setup()
    const first = renderApp()
    const dialog = screen.getByRole('dialog', { name: /how to play/i })
    await user.click(within(dialog).getByRole('button', { name: /close/i }))
    first.unmount()
    renderApp()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens stats with the solved-on-clue chart', async () => {
    const user = userEvent.setup()
    renderApp()
    await guess(user, answer.name)
    await user.click(screen.getByRole('button', { name: /statistics/i }))
    const dialog = screen.getByRole('dialog', { name: /statistics/i })
    expect(within(dialog).getByText('Clue 1: 1 win')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('copies a spoiler-free result when Web Share is missing', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share: undefined, clipboard: { writeText } })
    renderApp()
    await guess(user, answer.name)
    await user.click(screen.getByRole('button', { name: /share/i }))
    const text = writeText.mock.calls[0]![0] as string
    expect(text.split('\n')[0]).toBe(`Cricdle 🏏 1/${MAX_CLUES} clues`)
    expect(text).not.toContain(answer.name)
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument()
  })

  it('announces new clues for screen readers', async () => {
    const user = userEvent.setup()
    renderApp()
    await guess(user, wrongPlayers[0]!.name)
    const live = document.querySelector('[aria-live="polite"][aria-atomic="true"]')!
    expect(live.textContent).toMatch(new RegExp(`Not ${wrongPlayers[0]!.name}\\. Clue 2`))
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
      // Help modal shows (nothing could be stored); close it and play.
      await user.keyboard('{Escape}')
      await guess(user, answer.name)
      expect(screen.getByRole('heading', { name: /first clue/i })).toBeInTheDocument()
    } finally {
      Object.defineProperty(window, 'localStorage', original)
    }
  })
})
