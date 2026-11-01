import { describe, expect, it } from 'vitest'
import { makePlayer } from '../test/fixtures'
import { normalize, searchPlayers } from './search'

const players = [
  makePlayer({ id: 'virat-kohli', name: 'Virat Kohli', aliases: ['King Kohli'], difficulty: 1 }),
  makePlayer({ id: 'ab-de-villiers', name: 'AB de Villiers', aliases: ['Mr 360'], difficulty: 1 }),
  makePlayer({ id: 'ms-dhoni', name: 'MS Dhoni', aliases: ['Thala', 'Mahi'], difficulty: 1 }),
  makePlayer({ id: 'inzamam', name: 'Inzamam-ul-Haq', aliases: [], difficulty: 2 }),
  makePlayer({ id: 'muralitharan', name: 'Muttiah Muralitharan', aliases: ['Murali'] }),
  makePlayer({ id: 'zoe', name: 'Zoë Accented', aliases: [], difficulty: 3 }),
  makePlayer({ id: 'kumar-s', name: 'Kumar Sangakkara', aliases: [], difficulty: 1 }),
  makePlayer({ id: 'akhil', name: 'Akhil Kumar', aliases: [], difficulty: 3 }),
]
const ids = (q: string, exclude: string[] = []) =>
  searchPlayers(players, q, exclude).map((p) => p.id)

describe('normalize', () => {
  it('lowercases and strips accents and dots', () => {
    expect(normalize('  Zoë  M.S. Dhoní ')).toBe('zoe ms dhoni')
  })
})

describe('searchPlayers', () => {
  it('returns nothing for an empty query', () => {
    expect(ids('')).toEqual([])
    expect(ids('   ')).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(ids('VIRAT')).toEqual(['virat-kohli'])
  })

  it('is accent-insensitive in both directions', () => {
    expect(ids('zoe')).toEqual(['zoe'])
    expect(ids('zoë')).toEqual(['zoe'])
  })

  it('matches the start of any word in the name', () => {
    expect(ids('kohli')).toEqual(['virat-kohli'])
    expect(ids('vill')).toEqual(['ab-de-villiers'])
    expect(ids('haq')).toEqual(['inzamam'])
  })

  it('does not match the middle of a word', () => {
    expect(ids('ohli')).toEqual([])
    expect(ids('hon')).toEqual([])
  })

  it('matches multi-word queries', () => {
    expect(ids('ms dh')).toEqual(['ms-dhoni'])
    expect(ids('de vil')).toEqual(['ab-de-villiers'])
  })

  it('matches aliases', () => {
    expect(ids('thala')).toEqual(['ms-dhoni'])
    expect(ids('murali')).toEqual(['muralitharan'])
  })

  it('ranks full-name prefix matches first', () => {
    // "Kumar Sangakkara" starts with "kumar"; "Akhil Kumar" only has it as a later word.
    expect(ids('kumar')).toEqual(['kumar-s', 'akhil'])
  })

  it('ranks name matches above alias-only matches', () => {
    const list = [
      makePlayer({ id: 'alias-only', name: 'Someone Else', aliases: ['King'], difficulty: 1 }),
      makePlayer({ id: 'name', name: 'Kingsley Test', aliases: [], difficulty: 3 }),
    ]
    expect(searchPlayers(list, 'king').map((p) => p.id)).toEqual(['name', 'alias-only'])
  })

  it('excludes already-guessed players', () => {
    expect(ids('k', ['virat-kohli'])).not.toContain('virat-kohli')
  })

  it('returns at most 8 results', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      makePlayer({ id: `p${i}`, name: `Sam Player${i}` }),
    )
    expect(searchPlayers(many, 'sam')).toHaveLength(8)
  })
})
