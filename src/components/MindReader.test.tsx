import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { STORAGE_KEYS } from '../config'
import { PLAYERS } from '../lib/players'
import { QUESTIONS } from '../lib/questions'

const random = () => 0
type User = ReturnType<typeof userEvent.setup>

const target = PLAYERS.find((p) => p.difficulty === 1)!

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(STORAGE_KEYS.seenHelp, 'true')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderApp() {
  return render(<App random={random} />)
}

async function openMindReader(user: User) {
  await user.click(screen.getByRole('button', { name: 'Mind Reader' }))
}

/** The question currently showing, or null when the game is guessing / done. */
function currentQuestion() {
  const heading = document.getElementById('mind-move-heading')
  if (!heading) return null
  return QUESTIONS.find((q) => q.text === heading.textContent) ?? null
}

/** Answer truthfully for `player` until the round ends. */
async function playTruthfully(user: User, player = target) {
  for (let i = 0; i < 30; i++) {
    if (screen.queryByRole('heading', { name: /got it in|you beat me/i })) return
    const q = currentQuestion()
    if (q) {
      const truth = q.test(player)
      const name = truth === null ? 'Not sure' : truth ? 'Yes' : 'No'
      await user.click(screen.getByRole('button', { name }))
    } else {
      const guessText =
        document.querySelector('[aria-labelledby="mind-move-heading"] p.pop')?.textContent ?? ''
      const correct = guessText === `${player.name}?`
      await user.click(screen.getByRole('button', { name: correct ? /that.s right/i : 'No' }))
    }
  }
  throw new Error('round did not finish')
}

describe('Mind Reader', () => {
  it('switches modes and waits for Start', async () => {
    const user = userEvent.setup()
    renderApp()
    await openMindReader(user)
    expect(screen.getByRole('button', { name: 'Mind Reader' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('heading', { name: /think of any international cricketer/i }))
    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(currentQuestion()).not.toBeNull()
    expect(screen.getByText('Question 1', { selector: 'p' })).toBeInTheDocument()
  })

  it('guesses a famous player from truthful answers', async () => {
    const user = userEvent.setup()
    renderApp()
    await openMindReader(user)
    await user.click(screen.getByRole('button', { name: /start/i }))
    await playTruthfully(user)
    const result = screen.getByRole('heading', { name: /got it in \d+ questions?!/i })
    expect(result).toBeInTheDocument()
    expect(screen.getAllByText(target.name).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /play again/i }))
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  }, 30_000)

  it('answers with the keyboard', async () => {
    const user = userEvent.setup()
    renderApp()
    await openMindReader(user)
    await user.click(screen.getByRole('button', { name: /start/i }))
    const first = currentQuestion()!
    await user.keyboard('y')
    const history = screen.getByRole('region', { name: 'So far' })
    expect(within(history).getByText(first.text)).toBeInTheDocument()
    expect(within(history).getByText('Yes')).toBeInTheDocument()
    const second = currentQuestion()!
    await user.keyboard('?')
    expect(within(history).getByText(second.text)).toBeInTheDocument()
    expect(within(history).getByText('Not sure')).toBeInTheDocument()
  })

  it('restores the round after a reload, and the mode', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await openMindReader(user)
    await user.click(screen.getByRole('button', { name: /start/i }))
    const first = currentQuestion()!
    await user.click(screen.getByRole('button', { name: 'No' }))
    const second = currentQuestion()!
    unmount()

    renderApp()
    expect(screen.getByRole('button', { name: 'Mind Reader' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(currentQuestion()?.id).toBe(second.id)
    const history = screen.getByRole('region', { name: 'So far' })
    expect(within(history).getByText(first.text)).toBeInTheDocument()
  })

  it('keeps each mode’s round when switching', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: /another clue/i }))
    expect(screen.getByText('Clue 2 of 10')).toBeInTheDocument()
    await openMindReader(user)
    await user.click(screen.getByRole('button', { name: /start/i }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    await user.click(screen.getByRole('button', { name: 'Guess the player' }))
    expect(screen.getByText('Clue 2 of 10')).toBeInTheDocument()
    await openMindReader(user)
    expect(screen.getByRole('region', { name: 'So far' })).toBeInTheDocument()
  })

  it('ends the round, takes a reveal and explains mismatches', async () => {
    const user = userEvent.setup()
    renderApp()
    await openMindReader(user)
    await user.click(screen.getByRole('button', { name: /start/i }))
    // Answer the first question wrongly for the target, then end the round.
    const q = currentQuestion()!
    const truth = q.test(target)
    await user.click(screen.getByRole('button', { name: truth ? 'No' : 'Yes' }))
    await user.click(screen.getByRole('button', { name: /end round/i }))
    expect(screen.queryByRole('heading', { name: /you beat me/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /tap again to end round/i }))
    expect(screen.getByRole('heading', { name: /you beat me/i })).toBeInTheDocument()

    await user.type(screen.getByRole('combobox'), target.name)
    const option = screen
      .getAllByRole('option')
      .find((o) => within(o).queryByText(target.name, { exact: true }))!
    await user.click(option)
    expect(screen.getByText(/one answer didn.t match my data/i)).toBeInTheDocument()
    expect(screen.getByText(q.text, { exact: false, selector: 'li' })).toBeInTheDocument()
  })

  it('records stats, opens them on the Mind Reader tab, and shares without names', async () => {
    // userEvent.setup() installs its own clipboard, so stub after it.
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { share: undefined, clipboard: { writeText } })
    renderApp()
    await openMindReader(user)
    await user.click(screen.getByRole('button', { name: /start/i }))
    await playTruthfully(user)

    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument()
    const text = (writeText.mock.calls[0] as unknown as [string])[0]
    expect(text).toMatch(/^Cricdle Mind Reader 🧠 read my mind in \d+\/10 questions/)
    expect(text).not.toContain(target.name)

    await user.click(screen.getByRole('button', { name: 'Statistics' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('tab', { name: 'Mind Reader' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const played = within(dialog).getByText('Played').parentElement!
    expect(played).toHaveTextContent('1')
    expect(within(dialog).getByText('I guessed').parentElement).toHaveTextContent('1')
    await user.click(within(dialog).getByRole('tab', { name: 'Guess the player' }))
    expect(within(dialog).getByText(/a streak counts rounds won in a row/i)).toBeInTheDocument()
  }, 30_000)

  it('explains Mind Reader in How to play', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'How to play' }))
    expect(screen.getByRole('heading', { name: /mind reader mode/i })).toBeInTheDocument()
  })
})
