import { describe, expect, it, vi } from 'vitest'
import { makePlayer } from '../test/fixtures'
import { compare } from './compare'
import { buildShareText, shareText } from './share'

const answer = makePlayer({ id: 'virat-kohli', name: 'Virat Kohli' })
const miss = compare(
  makePlayer({
    id: 'other',
    name: 'Shane Warne',
    country: 'Australia',
    role: 'Bowler',
    debutYear: 2008,
    intlMatches: 290,
  }),
  answer,
)
const hit = compare(answer, answer)

describe('buildShareText', () => {
  it('shows N/8 and one emoji row per guess on a win', () => {
    const text = buildShareText({
      puzzleNumber: 42,
      results: [miss, hit],
      won: true,
      siteUrl: 'https://example.com',
    })
    expect(text).toBe(
      ['Cricdle #42 2/8 🏏', '⬜⬜🟩🟩🟨🟨🟩', '🟩🟩🟩🟩🟩🟩🟩', 'https://example.com'].join('\n'),
    )
  })

  it('shows ✖/8 on a loss', () => {
    const text = buildShareText({
      puzzleNumber: 7,
      results: Array.from({ length: 8 }, () => miss),
      won: false,
      siteUrl: 'https://example.com',
    })
    const lines = text.split('\n')
    expect(lines[0]).toBe('Cricdle #7 ✖/8 🏏')
    expect(lines).toHaveLength(10)
  })

  it('never includes player names or ids', () => {
    const text = buildShareText({ puzzleNumber: 1, results: [miss, hit], won: true })
    expect(text).not.toMatch(/Kohli|Warne|virat|other/i)
  })
})

describe('shareText', () => {
  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    expect(await shareText('hi', { share, clipboard: { writeText } })).toBe('shared')
    expect(share).toHaveBeenCalledWith({ text: 'hi' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('reports cancellation without falling back to the clipboard', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('no', 'AbortError'))
    const writeText = vi.fn()
    expect(await shareText('hi', { share, clipboard: { writeText } })).toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to the clipboard when share is missing or fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await shareText('hi', { clipboard: { writeText } })).toBe('copied')
    const share = vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError'))
    expect(await shareText('hi', { share, clipboard: { writeText } })).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('hi')
  })

  it('reports failure when nothing works', async () => {
    expect(await shareText('hi', {})).toBe('failed')
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    expect(await shareText('hi', { clipboard: { writeText } })).toBe('failed')
  })
})
