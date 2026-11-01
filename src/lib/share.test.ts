import { describe, expect, it, vi } from 'vitest'
import { buildShareText, shareText } from './share'

describe('buildShareText', () => {
  it('shows the clue a win came on, with a square per clue', () => {
    const text = buildShareText({
      round: { status: 'won', cluesRevealed: 3 },
      streak: 1,
      siteUrl: 'https://example.com',
    })
    expect(text).toBe(
      ['Cricdle 🏏 3/10 clues', '🟥🟥🟩⬜⬜⬜⬜⬜⬜⬜', 'https://example.com'].join('\n'),
    )
  })

  it('adds the streak when it is more than one', () => {
    const text = buildShareText({
      round: { status: 'won', cluesRevealed: 1 },
      streak: 4,
      siteUrl: 'https://example.com',
    })
    expect(text.split('\n')).toEqual([
      'Cricdle 🏏 1/10 clues',
      '🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜',
      '🔥 4 in a row',
      'https://example.com',
    ])
  })

  it('shows ✖ on a loss, marking the clues used', () => {
    const text = buildShareText({
      round: { status: 'lost', cluesRevealed: 4 },
      streak: 0,
      siteUrl: 'https://example.com',
    })
    expect(text.split('\n').slice(0, 2)).toEqual(['Cricdle 🏏 ✖/10 clues', '🟥🟥🟥🟥⬜⬜⬜⬜⬜⬜'])
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
  })

  it('reports failure when nothing works', async () => {
    expect(await shareText('hi', {})).toBe('failed')
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    expect(await shareText('hi', { clipboard: { writeText } })).toBe('failed')
  })
})
