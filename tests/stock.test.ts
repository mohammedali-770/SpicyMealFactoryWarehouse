import { describe, it, expect } from 'vitest'
import { formatSigned, stockStatus } from '@/features/inventory/stock'

describe('stockStatus', () => {
  it('classifies negative, empty and positive balances', () => {
    expect(stockStatus(-1)).toBe('negative')
    expect(stockStatus(-0.5)).toBe('negative')
    expect(stockStatus(0)).toBe('empty')
    expect(stockStatus(0.001)).toBe('ok')
    expect(stockStatus(120)).toBe('ok')
  })
})

describe('formatSigned', () => {
  it('prefixes positive quantities with + and leaves negatives as-is', () => {
    expect(formatSigned(100)).toBe('+100')
    expect(formatSigned(0.5)).toBe('+0.5')
    expect(formatSigned(-30)).toBe('-30')
  })

  it('renders zero without a sign', () => {
    expect(formatSigned(0)).toBe('0')
  })
})
