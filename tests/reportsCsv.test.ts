import { describe, it, expect } from 'vitest'
import { lastNDays, toCsv } from '@/features/reports/csv'

describe('toCsv', () => {
  it('joins headers and rows with newlines', () => {
    expect(
      toCsv(
        ['a', 'b'],
        [
          [1, 2],
          [3, 4],
        ],
      ),
    ).toBe('a,b\n1,2\n3,4')
  })

  it('quotes values containing comma, quote or newline', () => {
    expect(toCsv(['x'], [['a,b']])).toBe('x\n"a,b"')
    expect(toCsv(['x'], [['he said "hi"']])).toBe('x\n"he said ""hi"""')
    expect(toCsv(['x'], [['line1\nline2']])).toBe('x\n"line1\nline2"')
  })

  it('renders null/undefined as empty cells', () => {
    expect(toCsv(['a', 'b'], [[null, undefined]])).toBe('a,b\n,')
  })
})

describe('lastNDays', () => {
  it('returns an inclusive range of n business days ending today (Asia/Riyadh)', () => {
    // 2026-07-01T00:00:00Z is 03:00 in Riyadh -> business day 2026-07-01
    const now = new Date('2026-07-01T00:00:00Z')
    expect(lastNDays(now, 30)).toEqual({ from: '2026-06-02', to: '2026-07-01' })
    expect(lastNDays(now, 1)).toEqual({ from: '2026-07-01', to: '2026-07-01' })
  })
})
