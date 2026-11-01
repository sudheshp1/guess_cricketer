import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { STORAGE_KEYS } from '../config'
import { getPuzzleNumber } from '../lib/date'
import { PLAYERS } from '../lib/players'
import { Countdown } from './Countdown'
import { getAnswer } from '../lib/puzzle'

const NOW = new Date('2026-11-05T06:00:00Z') // 11:30 IST, 12h30m until the next puzzle
const now = () => NOW
const answer = getAnswer(getPuzzleNumber(NOW))
const wrong = PLAYERS.filter((p) => p.id !== answer.id)

async function guess(user: ReturnType<typeof userEvent.setup>, name: string) {
  const input = screen.getByRole('combobox')
  await user.type(input, name)
  const option = screen
    .getAllByRole('option')
    .find((o) => within(o).queryByText(name, { exact: true }))
  await user.click(option!)
}

function mockReducedMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

beforeEach(() => {
  window.localStorage.clear()
  mockReducedMotion()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('How to play', () => {
  it('opens automatically on the first visit only', async () => {
    const user = userEvent.setup()
    const first = render(<App now={now} />)
    const dialog = screen.getByRole('dialog', { name: /how to play/i })
    expect(within(dialog).getByText(/example/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    first.unmount()

    render(<App now={now} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reopens from the help button and closes with Escape, returning focus', async () => {
    window.localStorage.setItem(STORAGE_KEYS.seenHelp, 'true')
    const user = userEvent.setup()
    render(<App now={now} />)
    const help = screen.getByRole('button', { name: /how to play/i })
    await user.click(help)
    expect(screen.getByRole('dialog', { name: /how to play/i })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(help).toHaveFocus()
  })

  it('keeps Tab focus inside the dialog', async () => {
    const user = userEvent.setup()
    render(<App now={now} />)
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 6; i++) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })
})

describe('Stats', () => {
  it('shows empty stats, then counts a win', async () => {
    window.localStorage.setItem(STORAGE_KEYS.seenHelp, 'true')
    const user = userEvent.setup()
    render(<App now={now} />)
    await user.click(screen.getByRole('button', { name: /statistics/i }))
    let dialog = screen.getByRole('dialog', { name: /statistics/i })
    expect(within(dialog).getByText(/no wins yet/i)).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await guess(user, wrong[0]!.name)
    await guess(user, answer.name)
    // Result modal shows first; switch to the stats modal.
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /statistics/i }))
    dialog = screen.getByRole('dialog', { name: /statistics/i })
    const value = (label: string) =>
      within(dialog).getByText(label, { selector: 'dt' }).parentElement!.querySelector('dd')!
        .textContent
    expect(value('Played')).toBe('1')
    expect(value('Win %')).toBe('100')
    expect(value('Current streak')).toBe('1')
    expect(value('Max streak')).toBe('1')
    expect(within(dialog).getByText('2 guesses: 1 win')).toBeInTheDocument()
  })
})

describe('Result modal', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEYS.seenHelp, 'true')
  })

  it('appears after a win with the answer, countdown and share button', async () => {
    const user = userEvent.setup()
    render(<App now={now} />)
    await guess(user, answer.name)
    const dialog = await screen.findByRole('dialog', { name: /well played/i })
    expect(within(dialog).getByText(answer.name)).toBeInTheDocument()
    expect(within(dialog).getByText(/1\/8 guess/)).toBeInTheDocument()
    expect(within(dialog).getByRole('timer')).toHaveTextContent('12:30:00')
    expect(within(dialog).getByRole('button', { name: /share/i })).toBeInTheDocument()
  })

  it('appears after a loss and reveals the answer', async () => {
    const user = userEvent.setup()
    render(<App now={now} />)
    for (const p of wrong.slice(0, 8)) await guess(user, p.name)
    const dialog = await screen.findByRole('dialog', { name: /stumped/i })
    expect(within(dialog).getByText(answer.name)).toBeInTheDocument()
  })

  it('shares with the Web Share API when available', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    render(<App now={now} />)
    await guess(user, wrong[0]!.name)
    await guess(user, answer.name)
    const dialog = await screen.findByRole('dialog', { name: /well played/i })
    await user.click(within(dialog).getByRole('button', { name: /share/i }))
    expect(share).toHaveBeenCalledTimes(1)
    const text = share.mock.calls[0]![0].text as string
    expect(text.split('\n')[0]).toBe(`Cricdle #${getPuzzleNumber(NOW)} 2/8 🏏`)
    expect(text).not.toContain(answer.name)
  })

  it('copies to the clipboard and shows a toast when Web Share is missing', async () => {
    // userEvent.setup() installs its own clipboard, so stub navigator afterwards.
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share: undefined, clipboard: { writeText } })
    render(<App now={now} />)
    await guess(user, answer.name)
    const dialog = await screen.findByRole('dialog', { name: /well played/i })
    await user.click(within(dialog).getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument()
  })

  it('can be reopened from the results banner', async () => {
    const user = userEvent.setup()
    render(<App now={now} />)
    await guess(user, answer.name)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /see results/i }))
    expect(screen.getByRole('dialog', { name: /well played/i })).toBeInTheDocument()
  })

  it('counts down every second', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    let t = NOW.getTime()
    try {
      render(<Countdown now={() => new Date(t)} />)
      expect(screen.getByRole('timer')).toHaveTextContent('12:30:00')
      t += 1000
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(screen.getByRole('timer')).toHaveTextContent('12:29:59')
    } finally {
      vi.useRealTimers()
    }
  })
})
