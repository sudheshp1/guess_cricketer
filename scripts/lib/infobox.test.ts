// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseCsv } from './csv.ts'
import {
  extractInfobox,
  findCricinfoId,
  findListRowMatches,
  mapBattingHand,
  mapBowlingType,
  mapRole,
  parseInfoboxFields,
  readInfobox,
  spanIsOpen,
  stripMarkup,
} from './infobox.ts'
import { seededShuffle } from './shuffle.ts'
import { validatePlayers, validateSchedule } from './validate.ts'

const SAMPLE = `Intro {{Use dmy dates}}
{{Infobox cricketer
| name = Test Player
| country = India
| batting = Right-handed
| bowling = {{ubl|Right-arm [[leg break]]|Right-arm [[off break]]}}
| role = [[Batting order (cricket)#Top order|Top-order batter]]
| internationalspan = 2008–present
| testdebutdate = 20 June
| testdebutyear = 2011
| odidebutdate = 18 August 2008
| T20Idebutyear = 2010
| source = https://www.espncricinfo.com/cricketers/test-player-253802 Cricinfo
| date = 28 September 2026
| column1 = [[Test cricket|Test]]
| matches1 = 123
| column2 = [[One Day International|ODI]]
| matches2 = 1,315
| column3 = [[First-class cricket|FC]]
| matches3 = 156
}}
Body text.`

describe('infobox parsing', () => {
  const box = extractInfobox(SAMPLE)!
  const facts = readInfobox(parseInfoboxFields(box))

  it('extracts the infobox block with nested templates', () => {
    expect(box.startsWith('{{Infobox cricketer')).toBe(true)
    expect(box.endsWith('}}')).toBe(true)
    expect(box).not.toContain('Body text')
  })

  it('reads plain fields and strips links', () => {
    expect(facts.country).toBe('India')
    expect(facts.role).toBe('Top-order batter')
    expect(facts.bowling).toBe('Right-arm leg break, Right-arm off break')
  })

  it('reads debut years from year or date fields', () => {
    expect(facts.debutYears).toEqual({ test: 2011, odi: 2008, t20i: 2010 })
  })

  it('only counts international format columns', () => {
    expect(facts.matches).toEqual({ test: 123, odi: 1315 })
  })

  it('finds the ESPNcricinfo id from the source field', () => {
    expect(findCricinfoId(SAMPLE)).toBe('253802')
    expect(findCricinfoId('{{Cricinfo|id=35320}}')).toBe('35320')
    expect(findCricinfoId('see http://www.espncricinfo.com/ci/content/player/49289.html')).toBe(
      '49289',
    )
  })
})

describe('stripMarkup', () => {
  it('removes refs, comments and unknown templates', () => {
    expect(stripMarkup('Right-handed<ref>x</ref><!-- c -->{{sfn|a|b}}')).toBe('Right-handed')
  })
})

describe('mappers', () => {
  it.each([
    ['Right-arm fast-medium', 'Right-arm fast'],
    ['Right-arm medium-fast', 'Right-arm medium'],
    ['Right arm medium', 'Right-arm medium'],
    ['Left-arm fast', 'Left-arm fast'],
    ['Left-arm fast-medium', 'Left-arm fast'],
    ['Right-arm off break', 'Right-arm off-spin'],
    ['Right-arm off-break', 'Right-arm off-spin'],
    ['Leg break googly', 'Right-arm leg-spin'],
    ['Right-arm leg spin', 'Right-arm leg-spin'],
    ['Slow left-arm orthodox', 'Left-arm orthodox'],
    ['Left-arm unorthodox spin', 'Left-arm wrist-spin'],
    ['Right-arm medium, Right-arm off break', 'Right-arm medium'],
    ['none', 'None'],
  ])('bowling %s -> %s', (input, expected) => {
    expect(mapBowlingType(input)).toBe(expected)
  })

  it('maps a missing bowling field to None', () => {
    expect(mapBowlingType(null)).toBe('None')
  })

  it.each([
    ['Wicket-keeper-batter', 'Wicketkeeper-Batter'],
    ['Wicket-keeper', 'Wicketkeeper-Batter'],
    ['Bowling all-rounder', 'All-rounder'],
    ['Bowler', 'Bowler'],
    ['Opening batsman', 'Batter'],
    ['Top-order batter', 'Batter'],
  ])('role %s -> %s', (input, expected) => {
    expect(mapRole(input)).toBe(expected)
  })

  it('maps batting hand', () => {
    expect(mapBattingHand('Right-handed')).toBe('Right')
    expect(mapBattingHand('Left-handed')).toBe('Left')
    expect(mapBattingHand(null)).toBeNull()
  })

  it('detects open international spans', () => {
    expect(spanIsOpen('2008–present')).toBe(true)
    expect(spanIsOpen('1989–2013')).toBe(false)
    expect(spanIsOpen(null)).toBeNull()
  })
})

describe('findListRowMatches', () => {
  it('reads the match count from a one-line row', () => {
    const page = `|-\n| 2\n! {{sortname|Adam|Gilchrist}}\n| 2005 || 2008 || 13 || {{sort|0272|272}} ||<ref>{{cite web |url=https://www.espncricinfo.com/cricketers/adam-gilchrist-5390 }}</ref>\n|-`
    expect(findListRowMatches(page, { cricinfoId: '5390' })).toBe(13)
  })

  it('reads the match count from a one-cell-per-line row with hidden sort keys', () => {
    const page = `|-\n| 11\n! scope="row" | {{sortname|Sachin|Tendulkar}}\n|| 2006<span style="display: none">9.2</span> || 2006 || 1 || 10 || <ref>{{cite web|url=http://www.espncricinfo.com/ci/content/player/35320.html}}</ref>\n|- align=center\n| 9\n! scope="row" | {{sortname||Shoaib Akhtar}}\n| 2006\n| 2010\n| {{sort|015|15}}\n| x\n|<ref>{{cite web |url=http://www.espncricinfo.com/pakistan/content/player/42655.html}}</ref>`
    expect(findListRowMatches(page, { cricinfoId: '35320' })).toBe(1)
    expect(findListRowMatches(page, { cricinfoId: '42655' })).toBe(15)
    expect(findListRowMatches(page, { cricinfoId: '99999' })).toBeNull()
  })

  it('falls back to the linked article title', () => {
    const page = `|-
|200||[[Nayan Mongia]]||1994||2001||44||1442
|-
|201||[[Sunil Joshi (cricketer)|Sunil Joshi]]||1996||2000||15||352`
    expect(findListRowMatches(page, { title: 'Nayan Mongia' })).toBe(44)
    expect(findListRowMatches(page, { title: 'Sunil Joshi (cricketer)' })).toBe(15)
    expect(findListRowMatches(page, { title: 'Sunil Joshi' })).toBeNull()
  })

  it('matches {{sortname}} rows by the article they link to', () => {
    const page = `|- align="center"
| 25 || !scope="row" align="left"| {{sortname|Daniel|Vettori}} {{double-dagger}} || 2007 || 2014 || 34 || 205
|- align="center"
| 9 || {{sortname|Mark|Wood|Mark Wood (cricketer)}} || 2015 || 2024 || 20 || 1`
    expect(findListRowMatches(page, { title: 'Daniel Vettori' })).toBe(34)
    expect(findListRowMatches(page, { title: 'Mark Wood (cricketer)' })).toBe(20)
    expect(findListRowMatches(page, { title: 'Mark Wood' })).toBeNull()
  })
})

describe('parseCsv', () => {
  it('handles quotes, escaped quotes and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n1,\n')
    expect(rows).toEqual([
      { a: 'x, y', b: 'say "hi"' },
      { a: '1', b: '' },
    ])
  })
})

describe('validatePlayers', () => {
  const good = {
    id: 'test-player',
    name: 'Test Player',
    aliases: [],
    country: 'India',
    role: 'Batter',
    battingHand: 'Right',
    bowlingType: 'None',
    debutYear: 2000,
    intlMatches: 10,
    active: false,
    difficulty: 1,
  }

  it('accepts valid data', () => {
    expect(validatePlayers([good], 2026)).toEqual([])
  })

  it('rejects missing fields and bad enums', () => {
    const { role: _role, ...noRole } = good
    expect(validatePlayers([noRole], 2026)).toContain('test-player: missing role')
    expect(validatePlayers([{ ...good, country: 'Narnia' }], 2026)[0]).toMatch(/country/)
    expect(validatePlayers([{ ...good, bowlingType: 'Fast' }], 2026)[0]).toMatch(/bowlingType/)
  })

  it('rejects duplicate ids', () => {
    expect(validatePlayers([good, good], 2026)).toContain('test-player: duplicate id')
  })

  it('rejects debut years outside 1877 to the current year', () => {
    expect(validatePlayers([{ ...good, debutYear: 1876 }], 2026)[0]).toMatch(/outside/)
    expect(validatePlayers([{ ...good, debutYear: 2027 }], 2026)[0]).toMatch(/outside/)
    expect(validatePlayers([{ ...good, debutYear: 1877 }], 2026)).toEqual([])
  })

  it('rejects negative match counts', () => {
    expect(validatePlayers([{ ...good, intlMatches: -1 }], 2026)[0]).toMatch(/negative/)
  })
})

describe('schedule', () => {
  const players = ['a', 'b', 'c', 'd'].map((id) => ({ id, difficulty: 1 }))

  it('shuffles deterministically', () => {
    const ids = players.map((p) => p.id)
    expect(seededShuffle(ids, 'seed')).toEqual(seededShuffle(ids, 'seed'))
    expect([...seededShuffle(ids, 'seed')].sort()).toEqual(ids)
  })

  it('rejects unknown ids, hard players, and repeats inside the gap', () => {
    expect(validateSchedule(['a', 'b', 'c', 'd'], players, 365)).toEqual([])
    expect(validateSchedule(['a', 'z'], players, 365)[0]).toMatch(/unknown/)
    expect(validateSchedule(['a'], [{ id: 'a', difficulty: 3 }], 365)[0]).toMatch(/difficulty/)
    expect(validateSchedule(['a', 'b', 'a', 'c'], players, 365).length).toBeGreaterThan(0)
  })
})
