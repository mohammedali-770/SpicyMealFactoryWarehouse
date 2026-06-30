import { describe, it, expect } from 'vitest'
import { formatSAR } from '@/lib/currency'

// Intl inserts a (narrow) non-breaking space between the currency code and amount.
const normalize = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

describe('formatSAR', () => {
  it('formats SAR with grouping and 2 decimals (en)', () => {
    expect(normalize(formatSAR(1234.5))).toBe('SAR 1,234.50')
  })

  it('rounds to 2 decimal places', () => {
    expect(normalize(formatSAR(0.005))).toBe('SAR 0.01')
  })

  it('uses Western digits in the ar locale', () => {
    expect(normalize(formatSAR(1234.5, 'ar'))).toContain('1,234.50')
  })
})
