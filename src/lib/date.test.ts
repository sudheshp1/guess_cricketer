import { describe, expect, it } from 'vitest'
import { formatCountdown, getPuzzleNumber, msUntilNextPuzzle, puzzleDateString } from './date'

// IST = UTC+05:30, so IST midnight is 18:30 UTC the previous day.
const utc = (iso: string) => new Date(iso)

describe('puzzleDateString', () => {
  it('uses the IST date, not the UTC date', () => {
    expect(puzzleDateString(utc('2026-11-01T18:29:59Z'))).toBe('2026-11-01') // 23:59:59 IST
    expect(puzzleDateString(utc('2026-11-01T18:30:00Z'))).toBe('2026-11-02') // 00:00:00 IST
  })
})

describe('getPuzzleNumber', () => {
  const launch = '2026-11-01'

  it('is 1 on launch day (IST)', () => {
    expect(getPuzzleNumber(utc('2026-10-31T18:30:00Z'), launch)).toBe(1) // 00:00 IST Nov 1
    expect(getPuzzleNumber(utc('2026-11-01T12:00:00Z'), launch)).toBe(1)
  })

  it('rolls over exactly at IST midnight', () => {
    expect(getPuzzleNumber(utc('2026-11-01T18:29:59.999Z'), launch)).toBe(1) // 23:59:59 IST
    expect(getPuzzleNumber(utc('2026-11-01T18:30:00Z'), launch)).toBe(2) // 00:00 IST Nov 2
  })

  it('is the same for everyone at the same instant, whatever their local time zone', () => {
    // 2026-11-02 01:00 in New York (UTC-5) is 11:30 IST on Nov 2: puzzle 2.
    expect(getPuzzleNumber(utc('2026-11-02T06:00:00Z'), launch)).toBe(2)
  })

  it('counts whole days across month and year boundaries', () => {
    expect(getPuzzleNumber(utc('2026-12-01T06:00:00Z'), launch)).toBe(31)
    expect(getPuzzleNumber(utc('2027-11-01T06:00:00Z'), launch)).toBe(366)
  })

  it('stays at 1 before launch', () => {
    expect(getPuzzleNumber(utc('2026-10-01T06:00:00Z'), launch)).toBe(1)
  })
})

describe('msUntilNextPuzzle', () => {
  it('counts down to the next IST midnight', () => {
    expect(msUntilNextPuzzle(utc('2026-11-01T18:29:59Z'))).toBe(1000)
    expect(msUntilNextPuzzle(utc('2026-11-01T18:30:00Z'))).toBe(24 * 3600 * 1000)
    expect(msUntilNextPuzzle(utc('2026-11-01T06:30:00Z'))).toBe(12 * 3600 * 1000)
  })
})

describe('formatCountdown', () => {
  it('formats HH:MM:SS, rounding up partial seconds', () => {
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(999)).toBe('00:00:01')
    expect(formatCountdown(3_723_000)).toBe('01:02:03')
    expect(formatCountdown(24 * 3600 * 1000)).toBe('24:00:00')
  })

  it('never goes negative', () => {
    expect(formatCountdown(-5000)).toBe('00:00:00')
  })
})
