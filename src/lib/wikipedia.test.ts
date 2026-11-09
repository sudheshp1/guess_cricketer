import { describe, expect, it } from 'vitest'
import { PLAYERS } from './players'
import { wikipediaUrl } from './wikipedia'

describe('wikipediaUrl', () => {
  it('turns the article title into an English Wikipedia link', () => {
    expect(wikipediaUrl({ wikipedia: 'Virat Kohli' })).toBe(
      'https://en.wikipedia.org/wiki/Virat_Kohli',
    )
    expect(wikipediaUrl({ wikipedia: 'Steve Smith (cricketer)' })).toBe(
      'https://en.wikipedia.org/wiki/Steve_Smith_(cricketer)',
    )
  })

  it('encodes characters that are not safe in a URL', () => {
    expect(wikipediaUrl({ wikipedia: 'Muttiah Muralitharan?' })).toBe(
      'https://en.wikipedia.org/wiki/Muttiah_Muralitharan%3F',
    )
    expect(wikipediaUrl({ wikipedia: 'José' })).toBe('https://en.wikipedia.org/wiki/Jos%C3%A9')
  })

  it('every player has a Wikipedia article title', () => {
    const missing = PLAYERS.filter((p) => typeof p.wikipedia !== 'string' || !p.wikipedia.trim())
    expect(missing.map((p) => p.id)).toEqual([])
  })
})
